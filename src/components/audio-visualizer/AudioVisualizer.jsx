import { useState, useRef, useEffect } from 'react';
import './AudioVisualizer.css';

export default function AudioVisualizer({ audioRef, isPlaying }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const audio = audioRef?.current || (audioRef instanceof HTMLAudioElement ? audioRef : null);
    if (!audio || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let audioContext;
    let analyser;
    let dataArray;
    let source;

    const initAudioContext = () => {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audio);

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        setIsVisible(true);
        draw();
      } catch (error) {
        console.log('Audio context not available:', error);
        setIsVisible(false);
      }
    };

    const draw = () => {
      if (!isPlaying || !analyser) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#4A90E2');
        gradient.addColorStop(0.5, '#7B68EE');
        gradient.addColorStop(1, '#FF6B6B');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    const handlePlay = () => {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
      if (!audioContext) {
        initAudioContext();
      }
    };

    const handlePause = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (isPlaying) {
      handlePlay();
    } else {
      handlePause();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isPlaying, audioRef]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="audio-visualizer">
      <canvas
        ref={canvasRef}
        width={200}
        height={60}
        style={{ width: '100%', height: '60px' }}
      />
    </div>
  );
}
