import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Player, TeamPurse } from '../../types';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface WinnerModalProps {
  player: Player | null;
  isOpen: boolean;
  isAdmin: boolean;
  teams?: TeamPurse[];
  onClose: () => void;
  onMoveToSold?: (player: Player, teamId?: string, bidAmount?: number) => void;
  onMoveToUnsold?: (player: Player) => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  player,
  isOpen,
  isAdmin,
  teams = [],
  onClose,
  onMoveToSold,
  onMoveToUnsold,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen && player) {
      // Trigger silent celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
      });
    }
  }, [isOpen, player]);

  if (!isOpen || !player) return null;

  const handleSold = () => {
    if (onMoveToSold) {
      const amount = parseFloat(bidAmount) || 0;
      onMoveToSold(player, selectedTeam || undefined, amount);
    }
    onClose();
  };

  const handleUnsold = () => {
    if (onMoveToUnsold) {
      onMoveToUnsold(player);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl p-6 text-center overflow-hidden">
        {/* Glow header banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500" />

        <div className="my-2">
          <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-full mb-3">
            {player.category || 'Auction Round'} • Selected
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {player.name}
          </h2>
        </div>

        {isAdmin ? (
          <div className="mt-6 space-y-4 text-left border-t border-slate-800 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Winning Team (Optional)</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Select Team --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} (Rem: ₹{t.remaining.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bid Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={handleSold}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Move to Sold
              </button>

              <button
                onClick={handleUnsold}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-sm"
              >
                <XCircle className="w-4 h-4" />
                Move to Unsold
              </button>

              <button
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl shadow transition-all active:scale-95 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Do Nothing
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-slate-800 pt-4">
            <p className="text-slate-400 text-sm mb-4">
              Player has been selected on the wheel. Awaiting auctioneer confirmation.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all text-sm"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
