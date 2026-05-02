"use client";

import { createContext, useContext, useRef, useState, useEffect, useCallback, useMemo } from "react";

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const playPromiseRef = useRef(null);

  const [trackId, setTrackId] = useState(null);
  const [trackMeta, setTrackMeta] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";
    audio.volume = 1;

    let lastTimeUpdate = 0;
    audio.addEventListener("timeupdate", () => {
      const now = Date.now();
      if (now - lastTimeUpdate > 250) {
        lastTimeUpdate = now;
        setCurrentTime(audio.currentTime);
      }
    });
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => { setIsPlaying(false); setCurrentTime(0); });
    audio.addEventListener("waiting", () => setIsBuffering(true));
    audio.addEventListener("playing", () => { setIsBuffering(false); setIsPlaying(true); });
    audio.addEventListener("canplay", () => setIsBuffering(false));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("error", () => { setIsBuffering(false); setIsPlaying(false); });

    audioRef.current = audio;
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const loadTrack = useCallback((id, url, meta = null) => {
    if (!audioRef.current) return;
    if (trackId === id) return;

    const audio = audioRef.current;
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {});
      playPromiseRef.current = null;
    }
    audio.pause();
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);
    setDuration(0);
    setTrackId(id);
    if (meta) setTrackMeta(meta);
    audio.src = url;
    audio.load();
  }, [trackId]);

  const play = useCallback((id, url, meta = null) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (trackId === id) {
      if (meta) setTrackMeta(meta);
      if (isPlaying || isBuffering) return;
      setIsBuffering(true);
      const promise = audio.play();
      playPromiseRef.current = promise;
      if (promise !== undefined) {
        promise
          .then(() => { setIsPlaying(true); setIsBuffering(false); playPromiseRef.current = null; })
          .catch(() => { setIsPlaying(false); setIsBuffering(false); playPromiseRef.current = null; });
      }
      return;
    }

    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {});
      playPromiseRef.current = null;
    }
    audio.pause();
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);
    setDuration(0);
    setTrackId(id);
    if (meta) setTrackMeta(meta);
    audio.src = url;
    audio.load();

    setIsBuffering(true);
    const promise = audio.play();
    playPromiseRef.current = promise;
    if (promise !== undefined) {
      promise
        .then(() => { setIsPlaying(true); setIsBuffering(false); playPromiseRef.current = null; })
        .catch(() => { setIsPlaying(false); setIsBuffering(false); playPromiseRef.current = null; });
    }
  }, [trackId, isPlaying, isBuffering]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => { audio.pause(); })
        .catch(() => {});
      playPromiseRef.current = null;
    } else {
      audio.pause();
    }
    setIsPlaying(false);
    setIsBuffering(false);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying || isBuffering) {
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => { audio.pause(); }).catch(() => {});
        playPromiseRef.current = null;
      } else {
        audio.pause();
      }
      setIsPlaying(false);
      setIsBuffering(false);
    } else {
      setIsBuffering(true);
      const promise = audio.play();
      playPromiseRef.current = promise;
      if (promise !== undefined) {
        promise
          .then(() => { setIsPlaying(true); setIsBuffering(false); playPromiseRef.current = null; })
          .catch(() => { setIsPlaying(false); setIsBuffering(false); playPromiseRef.current = null; });
      }
    }
  }, [isPlaying, isBuffering]);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const dismiss = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playPromiseRef.current) {
      playPromiseRef.current.then(() => audio.pause()).catch(() => {});
    } else {
      audio.pause();
    }
    audio.src = "";
    setTrackId(null);
    setTrackMeta(null);
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const contextValue = useMemo(() => ({
    audioRef,
    trackId,
    trackMeta,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    setVolume,
    loadTrack,
    play,
    pause,
    togglePlay,
    seek,
    dismiss,
  }), [trackId, trackMeta, isPlaying, isBuffering, currentTime, duration, volume, loadTrack, play, pause, togglePlay, seek, dismiss]);

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}
