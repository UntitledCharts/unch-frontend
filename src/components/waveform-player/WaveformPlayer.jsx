import React, { useEffect, useRef } from 'react';

function getAudioNodes(audio) {
  if (audio._wfCtx && audio._wfCtx.state !== 'closed') {
    return { ctx: audio._wfCtx, analyser: audio._wfAnalyser };
  }
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    audio._wfCtx = ctx;
    audio._wfAnalyser = analyser;
    return { ctx, analyser };
  } catch (e) {
    console.warn('Web Audio API unavailable:', e);
    return null;
  }
}

export default function WaveformPlayer({ audioRef, isPlaying }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastHeightsRef = useRef([]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !canvasRef.current) return;

    const handlePlay = async () => {
      const nodes = getAudioNodes(audio);
      if (nodes?.ctx?.state === 'suspended') await nodes.ctx.resume().catch(() => {});
    };
    audio.addEventListener('play', handlePlay);

    if (!isPlaying) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      lastHeightsRef.current = [];
      return () => audio.removeEventListener('play', handlePlay);
    }

    let lastFrame = 0;

    const draw = (timestamp) => {
      if (timestamp - lastFrame < 33) { rafRef.current = requestAnimationFrame(draw); return; }
      lastFrame = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx2d = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

      const nodes = audio._wfCtx && audio._wfCtx.state !== 'closed' ? { analyser: audio._wfAnalyser } : null;
      const bufferLength = nodes?.analyser?.frequencyBinCount || 128;
      const barWidth = (w / bufferLength) * 2.5;

      let dataArray;
      if (nodes?.analyser) {
        dataArray = new Uint8Array(bufferLength);
        nodes.analyser.getByteFrequencyData(dataArray);
      }

      let anyActive = false;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        let barH = 0;
        if (dataArray && !audio.paused) {
          barH = (dataArray[i] / 255) * h;
          lastHeightsRef.current[i] = barH;
        } else if ((lastHeightsRef.current[i] || 0) > 0) {
          lastHeightsRef.current[i] *= 0.88;
          if (lastHeightsRef.current[i] < 0.5) lastHeightsRef.current[i] = 0;
          barH = lastHeightsRef.current[i];
        }
        if (barH > 0) {
          anyActive = true;
          const grad = ctx2d.createLinearGradient(0, h, 0, h - barH);
          grad.addColorStop(0, 'rgba(56,189,248,0.9)');
          grad.addColorStop(0.5, 'rgba(14,165,233,0.7)');
          grad.addColorStop(1, 'rgba(99,102,241,0.5)');
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(x, h - barH, barWidth, barH);
        }
        x += barWidth + 1;
      }

      if (anyActive || !audio.paused) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      audio.removeEventListener('play', handlePlay);
    };
  }, [audioRef, isPlaying]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        style={{ width: '100%', height: '100%', borderRadius: '0' }}
      />
    </div>
  );
}
