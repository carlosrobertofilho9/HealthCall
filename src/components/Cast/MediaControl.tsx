import React, { useState, useEffect } from 'react';
import { useCast } from './CastProvider';

const MediaControl: React.FC<{ mediaUrl: string; contentType: string }> = ({
  mediaUrl,
  contentType,
}) => {
  const { currentSession } = useCast();
  const [isPlaying, setIsPlaying] = useState(false);

  const loadMedia = async () => {
    if (!currentSession) return;
    const mediaInfo = new window.chrome.cast.media.MediaInfo(mediaUrl, contentType);
    const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
    try {
      await currentSession.loadMedia(request);
      setIsPlaying(true);
    } catch (err) {
      console.error('Erro ao carregar mídia:', err);
    }
  };

  const play = () => {
    if (currentSession) {
      currentSession.getMediaSession()?.play(null, () => {}, (err) => console.error(err));
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (currentSession) {
      currentSession.getMediaSession()?.pause(null, () => {}, (err) => console.error(err));
      setIsPlaying(false);
    }
  };

  return (
    <div>
      <button onClick={loadMedia}>Enviar para Cast</button>
      <button onClick={play} disabled={!isPlaying}>Play</button>
      <button onClick={pause} disabled={!isPlaying}>Pause</button>
    </div>
  );
};

export default MediaControl;
