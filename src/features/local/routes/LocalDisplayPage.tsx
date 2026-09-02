import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { localApi, type DisplaySettings, type LocalCall } from '../localApi';
import { getDisplayPreferences, type LocalDisplayPreferences } from '../stationSettings';
import { Maximize, Settings, Volume2, VolumeX } from 'lucide-react';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

const LocalDisplayPage: React.FC = () => {
  const [calls, setCalls] = useState<LocalCall[]>([]);
  const [preferences, setPreferences] = useState<LocalDisplayPreferences>(() => getDisplayPreferences());
  const [settings, setSettings] = useState<DisplaySettings>({ noticesEnabled: true });
  const [audioReady, setAudioReady] = useState(false);
  const [online, setOnline] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const current = calls[0];
  const noticesVisible = preferences.noticesEnabled && settings.noticesEnabled;

  const beep = useCallback(() => {
    if (!preferences.soundEnabled) return;
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = audioContextRef.current || new AudioContextCtor();
    audioContextRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
  }, [preferences.soundEnabled]);

  const speak = useCallback((call: LocalCall) => {
    if (!preferences.voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = `${call.patientName}. Dirija-se à ${call.destination}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [preferences.voiceEnabled]);

  const announce = useCallback((call: LocalCall) => {
    if (!audioReady) return;
    beep();
    window.setTimeout(() => speak(call), preferences.soundEnabled ? 520 : 0);
  }, [audioReady, beep, preferences.soundEnabled, speak]);

  useEffect(() => {
    Promise.all([localApi.getCalls(8), localApi.getSettings()])
      .then(([initialCalls, displaySettings]) => {
        setCalls(initialCalls);
        setSettings(displaySettings);
        setOnline(true);
      })
      .catch(() => setOnline(false));

    const unsubscribe = localApi.subscribe((event) => {
      setOnline(true);
      if (event.type === 'call') {
        setCalls((currentCalls) => [event.call, ...currentCalls.filter((call) => call.id !== event.call.id)].slice(0, 8));
        announce(event.call);
      }
      if (event.type === 'settings-changed') setSettings(event.settings);
    });
    return unsubscribe;
  }, [announce]);

  useEffect(() => {
    const sync = () => setPreferences(getDisplayPreferences());
    window.addEventListener('healthcall:display-preferences', sync as EventListener);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('healthcall:display-preferences', sync as EventListener);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const recent = useMemo(() => calls.slice(1, 6), [calls]);

  async function enableAudio() {
    setAudioReady(true);
    try {
      beep();
      if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();
    } catch {
      // Visual calls remain available even if the browser blocks audio.
    }
  }

  async function fullscreen() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#061524] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.20),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.18),transparent_30%)]" aria-hidden="true" />
      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white font-black text-slate-950">HC</span>
          <div>
            <h1 className="text-lg font-black tracking-tight">HealthCall</h1>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className={`size-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {online ? 'painel conectado' : 'reconectando'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!audioReady && (preferences.soundEnabled || preferences.voiceEnabled) && (
            <button onClick={enableAudio} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-emerald-950"><Volume2 className="size-4" /> Ativar áudio</button>
          )}
          <button onClick={fullscreen} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200 hover:bg-white/10" aria-label="Tela cheia"><Maximize className="size-4" /></button>
          <Link to="/settings" className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200 hover:bg-white/10" aria-label="Configurações"><Settings className="size-4" /></Link>
        </div>
      </header>

      <main className="relative z-10 grid flex-1 gap-5 p-5 sm:p-8 lg:grid-cols-[1fr_360px]">
        <section className="flex min-h-[60vh] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-sm">
          {current ? (
            <div key={current.id} className="w-full max-w-4xl text-center animate-in fade-in zoom-in-95 duration-300">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-300">Chamando agora</p>
              <h2 className="mt-5 break-words text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">{current.patientName}</h2>
              <div className="mx-auto mt-8 inline-flex min-w-[260px] items-center justify-center rounded-[1.6rem] bg-emerald-400 px-8 py-5 text-3xl font-black text-emerald-950 shadow-[0_18px_60px_rgba(52,211,153,0.22)] sm:text-4xl">
                {current.destination}
              </div>
              <p className="mt-5 text-base font-semibold text-slate-400">
                {current.station.role}{current.station.name ? ` · ${current.station.name}` : ''} · {formatTime(current.calledAt)}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-5 inline-flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5"><VolumeX className="size-7 text-slate-400" /></div>
              <h2 className="text-3xl font-black text-white">Aguardando chamadas</h2>
              <p className="mt-2 text-base font-semibold text-slate-400">As chamadas dos consultórios aparecerão aqui automaticamente.</p>
            </div>
          )}
        </section>

        <aside className="flex flex-col rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Histórico recente</p>
            <h3 className="mt-1 text-xl font-black">Últimas chamadas</h3>
          </div>
          <div className="space-y-3">
            {recent.length ? recent.map((call) => (
              <div key={call.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-white">{call.patientName}</p>
                    <p className="mt-1 text-sm font-bold text-emerald-300">{call.destination}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-500">{formatTime(call.calledAt)}</span>
                </div>
              </div>
            )) : <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm font-semibold text-slate-500">Nenhuma chamada anterior.</p>}
          </div>

          {noticesVisible && (
            <div className="mt-auto pt-5">
              <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm font-semibold leading-5 text-blue-100">
                Aguarde seu nome ou número de ficha ser chamado. Mantenha-se próximo ao painel.
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default LocalDisplayPage;
