"use client";

import { useRef, useEffect, useState } from "react";
import { useAudioPlayer, useAudioPlayerTime } from "../../contexts/AudioPlayerContext";
import { Play, Pause, X, Volume2, VolumeX, Music } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import "./MiniPlayer.css";

function MiniVisualizer({ audioRef, isPlaying }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const lastHeights = useRef([]);

    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        const audio = audioRef?.current;
        if (audio && isPlaying && !audio._miniAnalyser) {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const source = ctx.createMediaElementSource(audio);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                analyser.connect(ctx.destination);
                audio._miniCtx = ctx;
                audio._miniAnalyser = analyser;
            } catch (e) {
                if (audio._miniCtx?.state === "suspended") {
                    audio._miniCtx.resume().catch(() => {});
                }
            }
        }

        if (audio?._miniCtx?.state === "suspended") {
            audio._miniCtx.resume().catch(() => {});
        }

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);
            const canvas = canvasRef.current;
            if (!canvas) return;
            const c = canvas.getContext("2d");
            const w = canvas.width;
            const h = canvas.height;
            c.clearRect(0, 0, w, h);

            const analyser = audio?._miniAnalyser;
            const bufLen = analyser?.frequencyBinCount || 16;
            const data = analyser ? new Uint8Array(bufLen) : null;
            if (analyser) analyser.getByteFrequencyData(data);

            const bars = 16;
            const barW = (w / bars) - 1;
            for (let i = 0; i < bars; i++) {
                const di = Math.floor((i / bars) * (bufLen * 0.75));
                let bh = 0;
                if (data && audio && !audio.paused) {
                    bh = (data[di] / 255) * h;
                    lastHeights.current[i] = bh;
                } else if (lastHeights.current[i] > 0) {
                    lastHeights.current[i] *= 0.8;
                    bh = lastHeights.current[i];
                }
                if (bh < 0.5) continue;
                const x = i * (barW + 1);
                const g = c.createLinearGradient(0, h, 0, h - bh);
                g.addColorStop(0, "rgba(56,189,248,1)");
                g.addColorStop(1, "rgba(99,102,241,0.7)");
                c.fillStyle = g;
                c.beginPath();
                c.roundRect(x, h - bh, barW, bh, 1.5);
                c.fill();
            }
        };
        draw();

        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [audioRef, isPlaying]);

    return <canvas ref={canvasRef} width={80} height={28} className="mini-visualizer" />;
}

export default function MiniPlayer() {
    const {
        audioRef,
        trackId,
        trackMeta,
        isPlaying,
        isBuffering,
        volume,
        setVolume,
        togglePlay,
        seek,
        dismiss,
    } = useAudioPlayer();
    const { currentTime, duration } = useAudioPlayerTime();

    const [showVolume, setShowVolume] = useState(false);
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const [volBtnRect, setVolBtnRect] = useState(null);
    const volBtnRef = useRef(null);

    useEffect(() => {
        if (trackId) {
            setClosing(false);
            setVisible(true);
        }
    }, [trackId]);

    const handleDismiss = () => {
        setClosing(true);
        setTimeout(() => {
            setVisible(false);
            setClosing(false);
            dismiss();
        }, 280);
    };

    if (!visible) return null;

    const formatTime = (t) => {
        if (!t || isNaN(t)) return "0:00";
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const thumbnail = trackMeta?.thumbnail;
    const title = trackMeta?.title || "Now Playing";
    const href = trackMeta?.href;

    return (
        <div className={`mini-player${isPlaying ? " mini-player-playing" : ""}${closing ? " mini-player-closing" : ""}`}>
            <div className="mini-player-progress-bar">
                <div
                    className="mini-player-progress-fill"
                    style={{ width: `${progress}%` }}
                />
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="mini-player-seek"
                    aria-label="Seek"
                />
            </div>

            <div className="mini-player-body">
                <div className="mini-player-thumb">
                    {thumbnail
                        ? <img src={thumbnail} alt={title} />
                        : <div className="mini-player-thumb-placeholder"><Music size={16} /></div>
                    }
                    <MiniVisualizer audioRef={audioRef} isPlaying={isPlaying} />
                </div>

                <div className="mini-player-info">
                    {href
                        ? <Link href={href} className="mini-player-title">{title}</Link>
                        : <span className="mini-player-title">{title}</span>
                    }
                    <span className="mini-player-time">
                        {formatTime(currentTime)} / {duration ? formatTime(duration) : "--:--"}
                    </span>
                </div>

                <div className="mini-player-controls">
                    <button
                        className={`mini-play-btn${isBuffering ? " buffering" : ""}`}
                        onClick={togglePlay}
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isBuffering ? (
                            <span className="mini-spinner" />
                        ) : isPlaying ? (
                            <Pause size={18} />
                        ) : (
                            <Play size={18} />
                        )}
                    </button>

                    <div className="mini-volume-wrap">
                        <button
                            ref={volBtnRef}
                            className="mini-vol-btn"
                            onClick={() => {
                                if (volBtnRef.current) {
                                    setVolBtnRect(volBtnRef.current.getBoundingClientRect());
                                }
                                setShowVolume(v => !v);
                            }}
                            aria-label="Volume"
                        >
                            {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                        </button>
                        {showVolume && volBtnRect && typeof document !== 'undefined' && createPortal(
                            <div
                                className="mini-volume-slider-wrap"
                                style={{
                                    position: 'fixed',
                                    bottom: window.innerHeight - volBtnRect.top + 8,
                                    right: window.innerWidth - volBtnRect.right,
                                    zIndex: 99999,
                                }}
                            >
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="mini-volume-slider"
                                    aria-label="Volume"
                                />
                            </div>,
                            document.body
                        )}
                    </div>

                    <button className="mini-dismiss-btn" onClick={handleDismiss} aria-label="Close player">
                        <X size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}
