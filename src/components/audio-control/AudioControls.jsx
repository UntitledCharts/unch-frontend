import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import './AudioControls.css';

export default function AudioControls({
  bgmUrl,
  onPlay,
  onStop,
  isPlaying,
  isActive,
  audioRef: setAudioRef,
  currentTime: externalTime,
  duration: externalDuration,
}) {
  const isExternal = typeof externalTime === 'number';

  const [localDuration, setLocalDuration] = useState(0);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioElementRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  const duration = isExternal ? (externalDuration || 0) : localDuration;
  const currentTime = isExternal ? (externalTime || 0) : localCurrentTime;

  useEffect(() => {
    if (isExternal) setIsLoading(false);
  }, [isExternal]);

  useEffect(() => {
    if (isExternal || !audioElementRef.current) return;
    const audio = audioElementRef.current;

    const onTimeUpdate = () => setLocalCurrentTime(audio.currentTime);
    const onEnded = () => { setLocalCurrentTime(0); onStop(); };
    const onError = () => { setIsLoading(false); if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); };
    const onCanPlay = () => { setIsLoading(false); if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); };
    const onPlayEvt = () => { setIsLoading(false); if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); };
    const onMeta = () => {
      setLocalDuration(audio.duration);
      setIsLoading(false);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlayEvt);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlayEvt);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [isExternal, onStop, bgmUrl]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      if (!isExternal && audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      onStop();
    } else {
      setIsLoading(true);
      onPlay();

      if (!isExternal && audioElementRef.current) {
        try {
          await audioElementRef.current.play();
        } catch {
          setIsLoading(false);
        }
      } else {
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          loadingTimeoutRef.current = null;
        }, 400);
      }
    }
  };

  const handleSeek = (e) => {
    if (!isExternal && audioElementRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const newTime = ((e.clientX - rect.left) / rect.width) * duration;
      audioElementRef.current.currentTime = newTime;
      setLocalCurrentTime(newTime);
    }
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!bgmUrl) {
    return (
      <div className="audio-controls disabled">
        <span>No audio available</span>
      </div>
    );
  }

  return (
    <>
      {!isExternal && (
        <audio
          ref={(ref) => {
            audioElementRef.current = ref;
            if (setAudioRef) setAudioRef(ref);
          }}
          src={bgmUrl}
          preload="metadata"
          style={{ display: 'none' }}
        />
      )}
      <div className={`audio-controls ${isActive ? 'active' : ''}`}>
        <button
          className="play-pause-btn"
          onClick={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={16} className="loading" />
          ) : isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}
        </button>

        <div className="audio-info">
          <div className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div className="progress-bar" onClick={handleSeek}>
            <div
              className="progress-fill"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
