import React, { useEffect, useRef, useState } from 'react';

export default function WaveformPlayer({ audioRef, isPlaying }) {
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const lastHeightsRef = useRef([]);


    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;


        if (audio.crossOrigin !== "anonymous") {
            try {
                audio.crossOrigin = "anonymous";
            } catch (e) {
                console.warn("Cannot set crossOrigin", e);
            }
        }

        let animationFrame;

        const initAudioContext = () => {
            if (audioContextRef.current) return;

            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContext();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;

                if (!sourceRef.current) {
                    const source = ctx.createMediaElementSource(audio);
                    source.connect(analyser);
                    analyser.connect(ctx.destination);
                    sourceRef.current = source;
                }

                audioContextRef.current = ctx;
                analyserRef.current = analyser;
            } catch (e) {
                console.warn("Web Audio API init failed:", e);
            }
        };

        const draw = () => {
            if (!canvasRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            let dataArray;
            if (analyserRef.current) {
                const bufferLength = analyserRef.current.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                analyserRef.current.getByteFrequencyData(dataArray);
            }

            ctx.clearRect(0, 0, width, height);

            const bufferLength = analyserRef.current?.frequencyBinCount || 128;
            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                let barHeight = 0;

                if (dataArray && !audio.paused) {
                    barHeight = (dataArray[i] / 255) * height;
                    lastHeightsRef.current[i] = barHeight;
                } else if (lastHeightsRef.current[i] > 0) {
                    lastHeightsRef.current[i] *= 0.9;
                    if (lastHeightsRef.current[i] < 0.5) lastHeightsRef.current[i] = 0;
                    barHeight = lastHeightsRef.current[i];
                }

                if (barHeight > 0) {
                    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                    gradient.addColorStop(0, '#38bdf8');
                    gradient.addColorStop(1, '#0ea5e9');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                }

                x += barWidth + 1;
            }

            animationFrame = requestAnimationFrame(draw);
        };

        const handlePlay = async () => {
            initAudioContext();
            if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
            }
        };

        const handlePause = () => {
            // We don't cancel animation frame here to allow "drop down"
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handlePause);

        // Start drawing immediately
        draw();

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handlePause);
        };
    }, [audioRef]);

    return (
        <div className="visualizer-container" style={{ width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                width={600}
                height={80}
                style={{ width: '100%', height: '100%', borderRadius: '16px' }}
            />
        </div>
    );
}
