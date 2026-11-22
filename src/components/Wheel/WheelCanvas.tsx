import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player } from '../../types';

interface WheelCanvasProps {
  players: Player[];
  isSpinning: boolean;
  targetRotation: number;
  durationMs: number;
  onSpinEnd?: (winner: Player) => void;
  canSpin?: boolean;
  onSpinClick?: () => void;
}

const SLICE_COLORS = [
  '#f59e0b', // Amber/Gold
  '#15803d', // Green
  '#d97706', // Dark Amber
  '#166534', // Dark Green
  '#eab308', // Yellow
  '#14532d', // Forest
  '#b45309', // Rust
  '#1e3a8a', // Blue
  '#0284c7', // Cyan
  '#4338ca', // Indigo
];

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  players,
  isSpinning,
  targetRotation,
  durationMs,
  onSpinEnd,
  canSpin = false,
  onSpinClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentRotation, setCurrentRotation] = useState<number>(targetRotation);
  const animFrameRef = useRef<number | null>(null);
  const spinStartRef = useRef<{ startAngle: number; targetAngle: number; startTime: number; duration: number } | null>(null);

  // Easing function: easeOutCubic
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };

  // Helper to determine which player is pointed to by top pointer (pointer at 270 deg / -90 deg)
  const getSelectedPlayer = useCallback((rotationDeg: number): Player | null => {
    if (!players || players.length === 0) return null;
    const count = players.length;
    const sliceAngle = 360 / count;

    // Pointer is at 270 degrees (top: 3 * Math.PI / 2)
    // Normalized wheel rotation [0, 360)
    const normalizedRotation = ((rotationDeg % 360) + 360) % 360;
    // Calculate which segment hits 270
    const pointerAngle = (270 - normalizedRotation + 360) % 360;
    const index = Math.floor(pointerAngle / sliceAngle) % count;
    return players[index] || null;
  }, [players]);

  // Handle spin trigger
  useEffect(() => {
    if (isSpinning) {
      spinStartRef.current = {
        startAngle: currentRotation,
        targetAngle: targetRotation,
        startTime: performance.now(),
        duration: durationMs || 4000,
      };

      const animate = (now: number) => {
        if (!spinStartRef.current) return;
        const elapsed = now - spinStartRef.current.startTime;
        const progress = Math.min(1, elapsed / spinStartRef.current.duration);
        const easedProgress = easeOutQuart(progress);

        const newAngle =
          spinStartRef.current.startAngle +
          (spinStartRef.current.targetAngle - spinStartRef.current.startAngle) * easedProgress;

        setCurrentRotation(newAngle);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          spinStartRef.current = null;
          if (onSpinEnd) {
            const winner = getSelectedPlayer(targetRotation);
            if (winner) {
              onSpinEnd(winner);
            }
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    } else {
      setCurrentRotation(targetRotation);
    }
  }, [isSpinning, targetRotation, durationMs, onSpinEnd, getSelectedPlayer]);

  // Draw wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const size = Math.min(canvas.parentElement?.clientWidth || 460, 520);
    const dpr = window.devicePixelRatio || 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.scale(dpr, dpr);
    const center = size / 2;
    const radius = center - 20;

    ctx.clearRect(0, 0, size, size);

    if (!players || players.length === 0) {
      // Empty wheel state
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No players in this round', center, center);
      return;
    }

    const count = players.length;
    const sliceRad = (2 * Math.PI) / count;
    const rotationRad = (currentRotation * Math.PI) / 180;

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotationRad);

    // Draw slices
    players.forEach((player, i) => {
      const startAngle = i * sliceRad;
      const endAngle = startAngle + sliceRad;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw player name text
      ctx.save();
      ctx.rotate(startAngle + sliceRad / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';

      // Font size responsive to number of slices
      const fontSize = count > 20 ? 11 : count > 12 ? 13 : 15;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;

      // Truncate name if too long
      const maxTextWidth = radius - 60;
      let displayName = player.name;
      if (ctx.measureText(displayName).width > maxTextWidth) {
        displayName = displayName.substring(0, 14) + '...';
      }

      ctx.fillText(displayName, radius - 15, 0);
      ctx.restore();
    });

    // Outer wheel border rim
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.restore();

    // Center Hub (Fixed, not rotating)
    ctx.save();
    ctx.translate(center, center);

    // Hub outer shadow
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner hub button
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, 2 * Math.PI);
    ctx.fillStyle = canSpin && !isSpinning ? '#f59e0b' : '#1e293b';
    ctx.fill();

    ctx.fillStyle = canSpin && !isSpinning ? '#000000' : '#f8fafc';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSpinning ? '...' : canSpin ? 'SPIN' : 'WHEEL', 0, 0);

    ctx.restore();

    // Top Pointer Arrow pointing down onto wheel at 270 deg
    ctx.save();
    ctx.translate(center, center - radius);
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.lineTo(16, -18);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fillStyle = '#ef4444'; // Red pointer
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pointer pin head
    ctx.beginPath();
    ctx.arc(0, -18, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }, [players, currentRotation, canSpin, isSpinning]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none">
      <div
        className={`relative rounded-full shadow-2xl transition-transform ${
          canSpin && !isSpinning ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
        }`}
        onClick={() => {
          if (canSpin && !isSpinning && onSpinClick) {
            onSpinClick();
          }
        }}
      >
        <canvas ref={canvasRef} className="block rounded-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]" />
      </div>

      {canSpin && (
        <button
          onClick={onSpinClick}
          disabled={isSpinning || players.length === 0}
          className="mt-4 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-black tracking-wider text-lg rounded-xl shadow-lg transition-all transform active:scale-95 uppercase flex items-center gap-2"
        >
          {isSpinning ? 'Spinning...' : 'Spin The Wheel'}
        </button>
      )}
    </div>
  );
};
