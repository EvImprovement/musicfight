import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioElement, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars = 32;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bars) - 2;

      for (let i = 0; i < bars; i++) {
        // Generate dynamic bar heights based on music state & sinusoidal animation
        let barHeight = 4;
        if (isPlaying) {
          const time = Date.now() * 0.008;
          const factor1 = Math.sin(time + i * 0.3) * 0.5 + 0.5;
          const factor2 = Math.cos(time * 1.5 + i * 0.2) * 0.5 + 0.5;
          const randomBump = Math.random() * 0.2;
          barHeight = Math.max(6, (factor1 * 0.6 + factor2 * 0.4 + randomBump) * (height - 8));
        }

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient for bars (Neon Pink to Cyan)
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#8a2be2');
        gradient.addColorStop(0.5, '#00f2fe');
        gradient.addColorStop(1, '#ff007f');

        ctx.fillStyle = gradient;

        // Rounded top bars
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [audioElement, isPlaying]);

  return (
    <div className="visualizer-container">
      <canvas
        ref={canvasRef}
        width={320}
        height={64}
        className="visualizer-canvas"
      />
    </div>
  );
};
