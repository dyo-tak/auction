import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player } from '../../types';
import { Play } from 'lucide-react';

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
  '#f59e0b', // Amber
  '#15803d', // Green
  '#d97706', // Dark Amber
  '#166534', // Dark Green
  '#eab308', // Yellow
  '#14532d', // Forest
  '#b45309', // Rust
  '#2563eb', // Blue
  '#0284c7', // Cyan
  '#4f46e5', // Indigo
];

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  players,
  isSpinning,
  targetRotation,
  durationMs,
  onSpinEnd,
  canSpin = true,
  onSpinClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentRotation, setCurrentRotation] = useState<number>(targetRotation || 0);
  const [canvasDimension, setCanvasDimension] = useState<number>(420);
  const animFrameRef = useRef<number | null>(null);
  const spinStartRef = useRef<{ startAngle: number; targetAngle: number; startTime: number; duration: number } | null>(null);

  // Easing: smooth ease-out quartic
  const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

  // Determine winning player under the pointer (pointer at 270 degrees / Top)
  const getSelectedPlayer = useCallback((rotationDeg: number): Player | null => {
    if (!players || players.length === 0) return null;
    const count = players.length;
    const sliceAngle = 360 / count;
    const normalizedRotation = ((rotationDeg % 360) + 360) % 360;
    const pointerAngle = (270 - normalizedRotation + 360) % 360;
    const index = Math.floor(pointerAngle / sliceAngle) % count;
    return players[index] || null;
  }, [players]);

  // Handle Resize smoothly
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth || 420;
        const size = Math.max(280, Math.min(width - 16, 480));
        setCanvasDimension(size);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Spin Animation Loop
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

  // Render Wheel to HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvasDimension;
    const dpr = window.devicePixelRatio || 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.scale(dpr, dpr);
    const center = size / 2;
    const radius = center - 22;

    ctx.clearRect(0, 0, size, size);

    if (!players || players.length === 0) {
      // Empty wheel placeholder
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 15px Inter, sans-serif';
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

    // Draw Slices
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

      // Draw Player Name
      ctx.save();
      ctx.rotate(startAngle + sliceRad / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';

      const fontSize = count > 20 ? 11 : count > 12 ? 13 : 15;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;

      const maxTextWidth = radius - 55;
      let displayName = player.name;
      if (ctx.measureText(displayName).width > maxTextWidth) {
        displayName = displayName.substring(0, 14) + '...';
      }

      ctx.fillText(displayName, radius - 15, 0);
      ctx.restore();
    });

    // Outer rim
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.restore();

    // Center Hub (Fixed, not rotating)
    ctx.save();
    ctx.translate(center, center);

    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, 2 * Math.PI);
    ctx.fillStyle = canSpin && !isSpinning ? '#f59e0b' : '#1f2937';
    ctx.fill();

    ctx.fillStyle = canSpin && !isSpinning ? '#000000' : '#f9fafb';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSpinning ? '...' : 'SPIN', 0, 0);

    ctx.restore();

    // Top Pointer Arrow pointing down
    ctx.save();
    ctx.translate(center, center - radius);
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.lineTo(16, -18);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -18, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }, [players, currentRotation, canSpin, isSpinning, canvasDimension]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-center p-2 select-none">
      <div
        className={`relative rounded-full shadow-2xl transition-transform ${
          canSpin && !isSpinning && players.length > 0
            ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
            : ''
        }`}
        onClick={() => {
          if (canSpin && !isSpinning && players.length > 0 && onSpinClick) {
            onSpinClick();
          }
        }}
      >
        <canvas ref={canvasRef} className="block rounded-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.7)]" />
      </div>

      {canSpin && (
        <button
          onClick={onSpinClick}
          disabled={isSpinning || players.length === 0}
          className="mt-6 px-10 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 font-black tracking-wider text-lg rounded-2xl shadow-xl transition-all transform active:scale-95 uppercase flex items-center gap-2.5 cursor-pointer"
        >
          <Play className={`w-5 h-5 fill-current ${isSpinning ? 'animate-spin' : ''}`} />
          {isSpinning ? 'Spinning Wheel...' : 'Spin The Wheel'}
        </button>
      )}
    </div>
  );
};
