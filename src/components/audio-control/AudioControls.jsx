import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import './AudioControls.css';

export default function AudioControls({ bgmUrl, onPlay, onStop, isPlaying, isActive, audioRef: setAudioRef }) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioElementRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  useEffect(() => {
    if (audioElementRef.current) {
      const audio = audioElementRef.current;

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setCurrentTime(0);
        onStop();
      };

      const handleError = (e) => {
        console.error('Audio failed to load:', bgmUrl);
        console.error('Error details:', e.target.error);
        console.error('Network state:', e.target.networkState);
        console.error('Ready state:', e.target.readyState);
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      };

      const handleCanPlay = () => {
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      };

      const handlePlay = () => {
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      };

      const handleLoadStart = () => {
      };

      const handleLoadedData = () => {
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('loadeddata', handleLoadedData);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('loadeddata', handleLoadedData);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      };
    }
  }, [onStop, bgmUrl]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      onStop();
    } else {
      console.log('Attempting to play audio:', bgmUrl);
      setIsLoading(true);
      onPlay();
      
      
      if (audioElementRef.current) {
        try {
          await audioElementRef.current.play();
        } catch (error) {
          console.error('Audio.play() failed:', error);
          setIsLoading(false);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        }
      }
      
      
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        loadingTimeoutRef.current = null;
      }, 5000);
    }
  };

  const handleSeek = (e) => {
    if (audioElementRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      audioElementRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
      <audio
        ref={(ref) => {
          audioElementRef.current = ref;
          if (setAudioRef) setAudioRef(ref);
        }}
        src={bgmUrl}
        preload="metadata"
        style={{ display: 'none' }}
      />
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
              style={{ 
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' 
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
