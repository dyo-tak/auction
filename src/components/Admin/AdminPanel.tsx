import React, { useState } from 'react';
import { Player, TeamPurse } from '../../types';
import { getAppConfig, isAdminAuthenticated, setAdminAuthenticated } from '../../services/config';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { WheelCanvas } from '../Wheel/WheelCanvas';
import { WinnerModal } from '../Wheel/WinnerModal';
import { ConfigModal } from './ConfigModal';
import {
  Lock,
  Unlock,
  Settings,
  Plus,
  RotateCcw,
  Trash2,
  CheckCircle,
  XCircle,
  Sparkles,
  ClipboardPaste,
} from 'lucide-react';

interface AdminPanelProps {
  currentCategory: string;
  inAuction: Player[];
  sold: Player[];
  unsold: Player[];
  teams: TeamPurse[];
  onCategoryChange: (category: string) => void;
  onAddPlayers: (names: string[]) => void;
  onMoveToSold: (player: Player, teamName?: string, bidAmount?: number) => void;
  onMoveToUnsold: (player: Player) => void;
  onMoveBackToAuction: (player: Player) => void;
  onReaddUnsold: () => void;
  onClearCategory: () => void;
  onResetCategoryDefaults: (category: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentCategory,
  inAuction,
  sold,
  unsold,
  teams,
  onCategoryChange,
  onAddPlayers,
  onMoveToSold,
  onMoveToUnsold,
  onMoveBackToAuction,
  onReaddUnsold,
  onClearCategory,
  onResetCategoryDefaults,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isAdminAuthenticated());
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);
  const [configOpen, setConfigOpen] = useState<boolean>(false);
  const [excelPasteText, setExcelPasteText] = useState<string>('');
  const [customCatInput, setCustomCatInput] = useState<string>('');

  // Wheel State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [targetRotation, setTargetRotation] = useState<number>(0);
  const [selectedWinner, setSelectedWinner] = useState<Player | null>(null);
  const [winnerModalOpen, setWinnerModalOpen] = useState<boolean>(false);

  // Passcode verification
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const config = getAppConfig();
    const expected = config.adminPasscode || 'auction2026';
    if (passcodeInput.trim() === expected) {
      setAdminAuthenticated(true);
      setIsAuthenticated(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
  };

  // Add pasted names from Excel
  const handleAddPastedPlayers = () => {
    if (!excelPasteText.trim()) return;
    const names = excelPasteText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    onAddPlayers(names);
    setExcelPasteText('');
  };

  // Spin Wheel Trigger
  const handleSpinWheel = () => {
    if (inAuction.length === 0 || isSpinning) return;

    setIsSpinning(true);
    const count = inAuction.length;
    const winningIndex = Math.floor(Math.random() * count);
    const sliceAngle = 360 / count;

    const extraTurns = 5 + Math.floor(Math.random() * 3);
    const sliceMid = winningIndex * sliceAngle + sliceAngle / 2;
    const targetOffset = (270 - sliceMid + 360) % 360;

    const baseRot = Math.ceil(targetRotation / 360) * 360;
    const finalAngle = baseRot + extraTurns * 360 + targetOffset;

    setTargetRotation(finalAngle);
    const winningPlayer = inAuction[winningIndex];

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedWinner(winningPlayer);
      setWinnerModalOpen(true);
    }, 4500);
  };

  // Passcode Gate View
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Admin Wheel Panel</h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Enter the auctioneer passcode to manage players and spin the wheel.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter passcode (default: auction2026)"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-center text-lg text-white tracking-widest focus:outline-none ${
                  passcodeError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-amber-500'
                }`}
              />
              {passcodeError && (
                <p className="text-rose-400 text-xs mt-2 font-medium">Incorrect passcode. Please try again.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Unlock Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar: Category Selector & Admin Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category:</span>
          <select
            value={currentCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
          >
            {INITIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            {currentCategory && !INITIAL_CATEGORIES.includes(currentCategory) && (
              <option value={currentCategory}>{currentCategory}</option>
            )}
          </select>

          <button
            onClick={() => onResetCategoryDefaults(currentCategory)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            title="Load reference players for this category"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Reload Category Players
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 transition"
          >
            <Unlock className="w-3.5 h-3.5" />
            Lock
          </button>
        </div>
      </div>

      {/* Main Grid: Left Wheel, Right 3 Buckets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Wheel & Excel Paste (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Wheel Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                {currentCategory} ({inAuction.length} Players on Wheel)
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Click Wheel or Button to Spin
              </span>
            </div>

            <WheelCanvas
              players={inAuction}
              isSpinning={isSpinning}
              targetRotation={targetRotation}
              durationMs={4500}
              canSpin={true}
              onSpinClick={handleSpinWheel}
            />
          </div>

          {/* Excel Multiline Paste Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-amber-400" />
                Paste Player Names from Excel
              </h3>
              <span className="text-xs text-slate-400">1 name per line</span>
            </div>

            <textarea
              rows={3}
              value={excelPasteText}
              onChange={(e) => setExcelPasteText(e.target.value)}
              placeholder="Paste column of player names directly from Excel...&#10;Player 1&#10;Player 2"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New Category name..."
                  value={customCatInput}
                  onChange={(e) => setCustomCatInput(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-44"
                />
                <button
                  onClick={() => {
                    if (customCatInput.trim()) {
                      onCategoryChange(customCatInput.trim());
                      setCustomCatInput('');
                    }
                  }}
                  disabled={!customCatInput.trim()}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700"
                >
                  Set Category
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExcelPasteText('')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Clear
                </button>
                <button
                  onClick={handleAddPastedPlayers}
                  disabled={!excelPasteText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-xs shadow transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add to In Auction
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: The 3 Status Buckets (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs font-black uppercase text-slate-300">Category Buckets</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onReaddUnsold}
                disabled={unsold.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-40 text-blue-400 font-bold text-xs rounded-lg border border-blue-500/20"
                title="Return all unsold players to the wheel"
              >
                <RotateCcw className="w-3 h-3" />
                Re-spin Unsold
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Clear all players from this round?')) {
                    onClearCategory();
                  }
                }}
                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title="Clear current round"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bucket 1: Currently in Auction */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="bg-amber-500/10 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Currently in Auction ({inAuction.length})
              </span>
              <span className="text-[11px] text-slate-400">On Wheel</span>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {inAuction.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No players currently on the wheel. Paste names or click reload above.
                </div>
              ) : (
                inAuction.map((player) => (
                  <div
                    key={player.id}
                    className="p-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg text-xs"
                  >
                    <span className="font-bold text-slate-200">{player.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onMoveToSold(player)}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                        title="Move to Sold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onMoveToUnsold(player)}
                        className="p-1 text-rose-400 hover:bg-rose-500/20 rounded"
                        title="Move to Unsold"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bucket 2: Sold */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="bg-emerald-500/10 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Sold ({sold.length})
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {sold.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">No players marked sold yet.</div>
              ) : (
                sold.map((player) => (
                  <div
                    key={player.id}
                    className="p-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{player.name}</div>
                      {player.team && (
                        <div className="text-[10px] text-emerald-400">
                          {player.team} {player.bidAmount ? `• ₹${player.bidAmount.toLocaleString()}` : ''}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onMoveBackToAuction(player)}
                      className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded"
                      title="Move back to Wheel"
                    >
                      Return
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bucket 3: Unsold */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="bg-rose-500/10 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Unsold ({unsold.length})
              </span>
              {unsold.length > 0 && (
                <button
                  onClick={onReaddUnsold}
                  className="text-[10px] font-bold text-amber-400 hover:underline"
                >
                  Return all to Wheel
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {unsold.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">No unsold players in this round.</div>
              ) : (
                unsold.map((player) => (
                  <div
                    key={player.id}
                    className="p-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg text-xs"
                  >
                    <span className="font-bold text-slate-200">{player.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onMoveToSold(player)}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                        title="Mark Sold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onMoveBackToAuction(player)}
                        className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded"
                        title="Return to Wheel"
                      >
                        Return
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      <WinnerModal
        player={selectedWinner}
        isOpen={winnerModalOpen}
        isAdmin={true}
        teams={teams}
        onClose={() => setWinnerModalOpen(false)}
        onMoveToSold={(player, teamName, bid) => {
          onMoveToSold(player, teamName, bid);
          setWinnerModalOpen(false);
        }}
        onMoveToUnsold={(player) => {
          onMoveToUnsold(player);
          setWinnerModalOpen(false);
        }}
      />

      {/* Settings Modal */}
      <ConfigModal isOpen={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
};
