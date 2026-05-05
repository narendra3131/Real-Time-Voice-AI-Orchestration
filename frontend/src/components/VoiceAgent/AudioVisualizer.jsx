import React, { useRef, useEffect } from 'react';

/**
 * Canvas-based audio visualizer that renders an animated orb
 * responding to the agent's state (listening, thinking, speaking).
 */
function AudioVisualizer({ state, audioTrack }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 220;
    canvas.width = size * 2;  // Retina
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(2, 2);

    const center = size / 2;
    let time = 0;

    const stateColors = {
      idle: { r: 99, g: 102, b: 241 },
      listening: { r: 34, g: 197, b: 94 },
      thinking: { r: 245, g: 158, b: 11 },
      speaking: { r: 139, g: 92, b: 246 },
    };

    function draw() {
      ctx.clearRect(0, 0, size, size);
      time += 0.02;

      const color = stateColors[state] || stateColors.idle;
      const isActive = state === 'speaking' || state === 'thinking';
      const amplitude = isActive ? 20 : 8;
      const speed = isActive ? 1.5 : 0.8;

      // Draw concentric glow rings
      for (let ring = 3; ring >= 0; ring--) {
        const baseRadius = 30 + ring * 18;
        const wobble = Math.sin(time * speed + ring * 0.8) * amplitude * (1 - ring * 0.2);
        const radius = baseRadius + wobble;
        const alpha = 0.15 - ring * 0.03;

        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.02) {
          const noise = Math.sin(angle * 3 + time * speed) * (amplitude * 0.3) +
                        Math.sin(angle * 5 - time * speed * 0.7) * (amplitude * 0.2);
          const r = radius + noise * (isActive ? 1 : 0.3);
          const x = center + Math.cos(angle) * r;
          const y = center + Math.sin(angle) * r;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius + amplitude);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha + 0.1})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw core orb
      const coreRadius = 28 + Math.sin(time * speed * 1.2) * 4;
      const coreGradient = ctx.createRadialGradient(center, center, 0, center, center, coreRadius);
      coreGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`);
      coreGradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`);
      coreGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`);

      ctx.beginPath();
      ctx.arc(center, center, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Inner white glow
      const innerGlow = ctx.createRadialGradient(center, center, 0, center, center, 12);
      innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(center, center, 12, 0, Math.PI * 2);
      ctx.fillStyle = innerGlow;
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, audioTrack]);

  return (
    <canvas
      ref={canvasRef}
      className="audio-visualizer-canvas"
      style={{ display: 'block' }}
    />
  );
}

export default AudioVisualizer;
