import React, { useEffect, useRef } from 'react';

export function AudioVisualizer({ isActive, mode = 'ai' }) { // mode: 'ai' | 'user'
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const lines = 3;
      const primaryColor = mode === 'ai' ? 'rgba(0, 242, 254, ' : 'rgba(16, 185, 129, ';
      
      for (let l = 0; l < lines; l++) {
        ctx.beginPath();
        ctx.lineWidth = l === 0 ? 3 : 1.5;
        ctx.strokeStyle = `${primaryColor}${0.8 - l * 0.25})`;

        const amplitude = isActive ? (30 - l * 8) * (Math.sin(phase * 2) * 0.3 + 0.7) : 4;
        const frequency = 0.02 + l * 0.005;

        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin(x * frequency + phase + l) * amplitude * Math.sin((x / width) * Math.PI);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += isActive ? 0.08 : 0.02;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, mode]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={80} 
      style={{ width: '100%', height: '80px', display: 'block' }} 
    />
  );
}
