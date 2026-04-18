import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWarnings } from '@/features/warnings/hooks/useWarnings';
import type { Warning } from '@/features/warnings/types';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useResolvedWarningMediaUrl } from '@/features/warnings/hooks/useResolvedWarningMediaUrl';
import { DISPLAY_CLASS } from '../utils/displayTheme';

type WarningSnapshot = {
  warningId: string;
  remainingMs?: number;
  videoTime?: number;
};

interface WarningPlayerProps {
  enabled: boolean;
  paused: boolean;
  onFinish?: () => void;
}

const ONE_MINUTE_MS = 60000;
const DEFAULT_DURATION_SECONDS = 10;
const WARNING_CYCLE_COOLDOWN_MS = 15 * 60 * 1000;

function nowHHMM(): string {
  return new Date().toTimeString().slice(0, 5);
}

function isWithinSchedule(warning: Warning, currentTime: string): boolean {
  const start = warning.start_time?.slice(0, 5) || null;
  const end = warning.end_time?.slice(0, 5) || null;

  if (start && currentTime < start) return false;
  if (end && currentTime > end) return false;
  return true;
}

export const WarningPlayer: React.FC<WarningPlayerProps> = ({ enabled, paused, onFinish }) => {
  const { warnings } = useWarnings();
  const { speak, cancel: cancelTTS } = useTextToSpeech();

  const [clock, setClock] = useState(nowHHMM());
  const [index, setIndex] = useState(0);
  const [inCooldown, setInCooldown] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const snapshotRef = useRef<WarningSnapshot | null>(null);
  const spokenWarningRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const suspendedRef = useRef(true);
  const enabledRef = useRef(enabled);
  const pausedRef = useRef(paused);
  const currentWarningRef = useRef<Warning | null>(null);

  const activeWarnings = useMemo(() => {
    return warnings
      .filter((warning) => warning.active)
      .filter((warning) => warning.media_type === 'image' || warning.media_type === 'video')
      .filter((warning) => warning.content_url || warning.message)
      .filter((warning) => isWithinSchedule(warning, clock))
      .sort((a, b) => {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return (a.priority_order || 0) - (b.priority_order || 0);
      });
  }, [clock, warnings]);
  const current = inCooldown ? null : activeWarnings[index] || null;
  const resolvedContentUrl = useResolvedWarningMediaUrl(current?.content_url);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    deadlineRef.current = null;
  }, []);

  const clearCooldownTimer = useCallback(() => {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    clearTimer();
    clearCooldownTimer();
    cancelTTS();

    if (videoRef.current) {
      videoRef.current.pause();
    }

    snapshotRef.current = null;
    spokenWarningRef.current = null;
    suspendedRef.current = true;
    setIndex(0);
    setInCooldown(true);
    onFinish?.();

    cooldownTimerRef.current = setTimeout(() => {
      cooldownTimerRef.current = null;
      if (!mountedRef.current) return;

      snapshotRef.current = null;
      spokenWarningRef.current = null;
      setIndex(0);
      setInCooldown(false);
    }, WARNING_CYCLE_COOLDOWN_MS);
  }, [cancelTTS, clearCooldownTimer, clearTimer, onFinish]);

  const moveNext = useCallback(() => {
    if (!mountedRef.current || activeWarnings.length === 0) return;

    snapshotRef.current = null;
    spokenWarningRef.current = null;
    suspendedRef.current = false;

    if (index >= activeWarnings.length - 1) {
      startCooldown();
      return;
    }

    setIndex((previous) => Math.min(previous + 1, activeWarnings.length - 1));
  }, [activeWarnings.length, index, startCooldown]);

  const captureSnapshot = useCallback(
    (warning: Warning | null) => {
      if (!warning) return;

      if (warning.media_type === 'video') {
        const currentTime = videoRef.current?.currentTime || 0;
        snapshotRef.current = {
          warningId: warning.id,
          videoTime: currentTime,
        };
        return;
      }

      const defaultDurationMs = (warning.duration || DEFAULT_DURATION_SECONDS) * 1000;
      const remainingMs = deadlineRef.current
        ? Math.max(0, deadlineRef.current - Date.now())
        : defaultDurationMs;

      snapshotRef.current = {
        warningId: warning.id,
        remainingMs,
      };
    },
    []
  );

  const pausePlaybackNow = useCallback(() => {
    captureSnapshot(currentWarningRef.current);

    cancelTTS();
    clearTimer();

    if (videoRef.current) {
      videoRef.current.pause();
    }
    suspendedRef.current = true;
  }, [cancelTTS, captureSnapshot, clearTimer]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = nowHHMM();
      setClock((previous) => (previous === current ? previous : current));
    }, ONE_MINUTE_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
    pausedRef.current = paused;
  }, [enabled, paused]);

  useEffect(() => {
    currentWarningRef.current = current;
  }, [current]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      clearCooldownTimer();
      cancelTTS();
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [cancelTTS, clearCooldownTimer, clearTimer]);

  useEffect(() => {
    if (activeWarnings.length === 0) {
      clearCooldownTimer();
      setInCooldown(false);
      setIndex(0);
      return;
    }

    if (index >= activeWarnings.length) {
      setIndex(0);
    }
  }, [activeWarnings.length, clearCooldownTimer, index]);

  useEffect(() => {
    const onCallStarted = () => {
      pausePlaybackNow();
    };

    window.addEventListener('healthcall:call-started', onCallStarted);

    return () => {
      window.removeEventListener('healthcall:call-started', onCallStarted);
    };
  }, [pausePlaybackNow]);

  useEffect(() => {
    if (inCooldown) {
      clearTimer();
      cancelTTS();
      if (videoRef.current) {
        videoRef.current.pause();
      }
      suspendedRef.current = true;
      spokenWarningRef.current = null;
      return;
    }

    if (!current) {
      clearTimer();
      suspendedRef.current = true;
      spokenWarningRef.current = null;
      return;
    }

    if (!enabled || paused) {
      if (!suspendedRef.current) {
        pausePlaybackNow();
      }
      return;
    }

    suspendedRef.current = false;
    clearTimer();

    if (current.media_type === 'video') {
      if (current.message && spokenWarningRef.current !== current.id) {
        spokenWarningRef.current = current.id;
        speak(current.message).catch(() => undefined);
      }
      return;
    }

    const baseDurationMs = (current.duration || DEFAULT_DURATION_SECONDS) * 1000;
    const isSnapshotFromSameWarning = snapshotRef.current?.warningId === current.id;

    const durationMs = isSnapshotFromSameWarning
      ? Math.max(snapshotRef.current?.remainingMs || 0, 300)
      : baseDurationMs;

    deadlineRef.current = Date.now() + durationMs;

    timerRef.current = setTimeout(() => {
      moveNext();
    }, durationMs);

    if (current.message && spokenWarningRef.current !== current.id) {
      spokenWarningRef.current = current.id;
      speak(current.message).catch(() => undefined);
    }

    snapshotRef.current = null;

    return () => {
      clearTimer();
    };
  }, [cancelTTS, clearTimer, current, enabled, inCooldown, moveNext, pausePlaybackNow, paused, speak]);

  const requestVideoPlay = useCallback(() => {
    const tryPlay = (attempt: number) => {
      const video = videoRef.current;
      if (!video || !mountedRef.current || !enabledRef.current || pausedRef.current) return;

      const playResult = video.play();
      if (!playResult || typeof playResult.catch !== 'function') return;

      playResult.catch(() => {
        if (attempt >= 3 || !mountedRef.current || !enabledRef.current || pausedRef.current) return;
        setTimeout(() => {
          tryPlay(attempt + 1);
        }, 180);
      });
    };

    tryPlay(0);
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    if (!current || current.media_type !== 'video') return;
    if (!enabled || paused) return;

    const snapshot = snapshotRef.current;

    if (snapshot?.warningId === current.id && typeof snapshot.videoTime === 'number') {
      try {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(snapshot.videoTime, 0);
        }
      } catch {
        // Fallback controlado: reinicia o mesmo aviso do início
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }
    }

    snapshotRef.current = null;
    requestVideoPlay();
  }, [current, enabled, paused, requestVideoPlay]);

  const resumeVideoPlayback = useCallback(() => {
    if (!current || current.media_type !== 'video') return;
    if (!enabled || paused) return;

    const video = videoRef.current;
    if (!video) return;

    const snapshot = snapshotRef.current;
    if (snapshot?.warningId === current.id && typeof snapshot.videoTime === 'number') {
      try {
        video.currentTime = Math.max(snapshot.videoTime, 0);
      } catch {
        video.currentTime = 0;
      }
    }

    snapshotRef.current = null;
    requestVideoPlay();
  }, [current, enabled, paused, requestVideoPlay]);

  useEffect(() => {
    resumeVideoPlayback();
  }, [resumeVideoPlayback]);

  if (!current) return null;

  return (
    <div
      className={`absolute inset-0 z-40 transition-opacity duration-300 ${
        enabled ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className={`absolute inset-0 ${DISPLAY_CLASS.warningBackdrop}`} />

      <div className="relative h-full w-full flex items-center justify-center p-6 md:p-10">
        {current.media_type === 'video' && resolvedContentUrl ? (
          <div className={`w-full h-full max-w-[1800px] ${DISPLAY_CLASS.warningMedia}`}>
            <video
              key={current.id}
              ref={videoRef}
              src={resolvedContentUrl}
              className="w-full h-full object-contain"
              autoPlay
              preload="auto"
              playsInline
              loop={false}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onCanPlay={resumeVideoPlayback}
              onEnded={moveNext}
              onError={() => {
                snapshotRef.current = null;
                moveNext();
              }}
              muted={false}
            />
          </div>
        ) : resolvedContentUrl ? (
          <div className={`w-full h-full max-w-[1800px] ${DISPLAY_CLASS.warningMedia} flex items-center justify-center`}>
            <img
              key={current.id}
              src={resolvedContentUrl}
              alt={current.text || 'Aviso'}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className={`max-w-5xl ${DISPLAY_CLASS.warningMessagePanel}`}>
            <p className="text-4xl md:text-6xl font-black leading-tight">
              {current.message || current.text || 'Aviso'}
            </p>
          </div>
        )}
      </div>

      {(current.text || current.message) && (
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className={DISPLAY_CLASS.warningCaption}>
            {current.text && (
              <p className={`text-sm md:text-base uppercase tracking-[0.2em] ${DISPLAY_CLASS.iconPrimary} mb-2`}>{current.text}</p>
            )}
            {current.message && (
              <p className="text-xl md:text-3xl font-bold leading-snug">{current.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
