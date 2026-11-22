import React, { useState } from 'react';
import { AuctionState, Player, TeamPurse } from '../../types';
import { publishAuctionState } from '../../services/firebase';
import { getAppConfig, isAdminAuthenticated, setAdminAuthenticated } from '../../services/config';
import { INITIAL_CATEGORIES, SAMPLE_PLAYERS_BY_CATEGORY } from '../../data/mockData';
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
  auctionState: AuctionState;
  teams: TeamPurse[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ auctionState, teams }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isAdminAuthenticated());
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);
  const [configOpen, setConfigOpen] = useState<boolean>(false);
  const [excelPasteText, setExcelPasteText] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isSpinningLocal, setIsSpinningLocal] = useState<boolean>(false);

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

  // 1. Add pasted names from Excel to "In Auction"
  const handleAddPastedPlayers = () => {
    if (!excelPasteText.trim()) return;

    const names = excelPasteText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const newPlayers: Player[] = names.map((name) => ({
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name,
      category: auctionState.currentCategory,
      status: 'inAuction',
      addedAt: Date.now(),
    }));

    const updated: AuctionState = {
      ...auctionState,
      inAuction: [...auctionState.inAuction, ...newPlayers],
    };

    publishAuctionState(updated);
    setExcelPasteText('');
  };

  // 2. Load Preset category sample players
  const handleLoadPresetCategory = (cat: string) => {
    const names = SAMPLE_PLAYERS_BY_CATEGORY[cat] || [];
    const newPlayers: Player[] = names.map((name) => ({
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name,
      category: cat,
      status: 'inAuction',
      addedAt: Date.now(),
    }));

    const updated: AuctionState = {
      ...auctionState,
      currentCategory: cat,
      inAuction: newPlayers,
      sold: [],
      unsold: [],
      wheelState: {
        ...auctionState.wheelState,
        isSpinning: false,
        selectedPlayer: null,
        winnerModalOpen: false,
      },
    };

    publishAuctionState(updated);
  };

  // 3. Trigger Wheel Spin
  const handleSpinWheel = () => {
    if (auctionState.inAuction.length === 0 || isSpinningLocal || auctionState.wheelState.isSpinning) {
      return;
    }

    setIsSpinningLocal(true);

    const playersCount = auctionState.inAuction.length;
    // Pick random winning player index
    const winningIndex = Math.floor(Math.random() * playersCount);
    const sliceAngle = 360 / playersCount;

    // Pointer is at 270 deg (top). We calculate angle so that slice hits 270 deg.
    // slice center is: index * sliceAngle + sliceAngle / 2
    // targetRotation + sliceCenter = 270 (mod 360) + extra rotations (e.g. 5 full turns = 1800 deg)
    const extraTurns = 5 + Math.floor(Math.random() * 3); // 5 to 7 full spins
    const currentRot = auctionState.wheelState.targetRotation || 0;
    const sliceMid = winningIndex * sliceAngle + sliceAngle / 2;
    const targetOffset = (270 - sliceMid + 360) % 360;

    // Calculate absolute target angle ensuring forward motion
    const baseRot = Math.ceil(currentRot / 360) * 360;
    const finalAngle = baseRot + extraTurns * 360 + targetOffset;

    const winningPlayer = auctionState.inAuction[winningIndex];

    const updated: AuctionState = {
      ...auctionState,
      wheelState: {
        isSpinning: true,
        targetRotation: finalAngle,
        durationMs: 4500,
        selectedPlayer: winningPlayer,
        winnerModalOpen: false,
        spinTimestamp: Date.now(),
      },
    };

    publishAuctionState(updated);

    // Auto open winner modal once spin completes
    setTimeout(() => {
      setIsSpinningLocal(false);
      publishAuctionState({
        ...updated,
        wheelState: {
          ...updated.wheelState,
          isSpinning: false,
          winnerModalOpen: true,
        },
      });
    }, 4500);
  };

  // Move Player actions
  const handleMoveToSold = (player: Player, team?: string, bidAmount?: number) => {
    const updatedInAuction = auctionState.inAuction.filter((p) => p.id !== player.id);
    const updatedUnsold = auctionState.unsold.filter((p) => p.id !== player.id);
    const soldPlayer: Player = {
      ...player,
      status: 'sold',
      team: team || player.team,
      bidAmount: bidAmount !== undefined ? bidAmount : player.bidAmount,
    };

    publishAuctionState({
      ...auctionState,
      inAuction: updatedInAuction,
      unsold: updatedUnsold,
      sold: [soldPlayer, ...auctionState.sold],
      wheelState: {
        ...auctionState.wheelState,
        winnerModalOpen: false,
      },
    });
  };

  const handleMoveToUnsold = (player: Player) => {
    const updatedInAuction = auctionState.inAuction.filter((p) => p.id !== player.id);
    const unsoldPlayer: Player = {
      ...player,
      status: 'unsold',
    };

    publishAuctionState({
      ...auctionState,
      inAuction: updatedInAuction,
      unsold: [unsoldPlayer, ...auctionState.unsold],
      wheelState: {
        ...auctionState.wheelState,
        winnerModalOpen: false,
      },
    });
  };

  const handleMoveBackToAuction = (player: Player) => {
    const updatedSold = auctionState.sold.filter((p) => p.id !== player.id);
    const updatedUnsold = auctionState.unsold.filter((p) => p.id !== player.id);
    const inAuctionPlayer: Player = {
      ...player,
      status: 'inAuction',
    };

    publishAuctionState({
      ...auctionState,
      sold: updatedSold,
      unsold: updatedUnsold,
      inAuction: [...auctionState.inAuction, inAuctionPlayer],
    });
  };

  const handleReaddUnsoldToAuction = () => {
    if (auctionState.unsold.length === 0) return;
    const readded: Player[] = auctionState.unsold.map((p) => ({
      ...p,
      status: 'inAuction',
    }));

    publishAuctionState({
      ...auctionState,
      inAuction: [...auctionState.inAuction, ...readded],
      unsold: [],
    });
  };

  const handleClearCategory = () => {
    if (window.confirm('Clear all players from the current round?')) {
      publishAuctionState({
        ...auctionState,
        inAuction: [],
        sold: [],
        unsold: [],
        wheelState: {
          ...auctionState.wheelState,
          isSpinning: false,
          selectedPlayer: null,
          winnerModalOpen: false,
        },
      });
    }
  };

  // Passcode Gate View
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Admin Access</h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Enter the auctioneer passcode to manage players and control the wheel.
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
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
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
      {/* Admin Subheader & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Category:</span>
          <select
            value={auctionState.currentCategory}
            onChange={(e) => {
              const cat = e.target.value;
              publishAuctionState({
                ...auctionState,
                currentCategory: cat,
              });
            }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
          >
            {INITIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            {auctionState.currentCategory &&
              !INITIAL_CATEGORIES.includes(auctionState.currentCategory) && (
                <option value={auctionState.currentCategory}>{auctionState.currentCategory}</option>
              )}
          </select>

          {/* Quick preset button */}
          <button
            onClick={() => handleLoadPresetCategory(auctionState.currentCategory)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
            title="Load reference players for this category"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Load Sample Pool
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings & Keys
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

      {/* Main Layout: Wheel & Excel Paste on Left/Center, 3 Buckets on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Wheel & Excel Paste (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Wheel Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Spinner ({auctionState.inAuction.length} Players on Wheel)
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Admin Sync Active
              </span>
            </div>

            <WheelCanvas
              players={auctionState.inAuction}
              isSpinning={isSpinningLocal || auctionState.wheelState.isSpinning}
              targetRotation={auctionState.wheelState.targetRotation}
              durationMs={auctionState.wheelState.durationMs}
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
              rows={4}
              value={excelPasteText}
              onChange={(e) => setExcelPasteText(e.target.value)}
              placeholder="Paste column of player names directly from Excel...&#10;Player 1&#10;Player 2&#10;Player 3"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Custom Category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-44"
                />
                <button
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      publishAuctionState({
                        ...auctionState,
                        currentCategory: newCategoryName.trim(),
                      });
                      setNewCategoryName('');
                    }
                  }}
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-xs shadow transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add to In Auction
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: The 3 Status Columns / Buckets (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs font-black uppercase text-slate-300">Category Bucket Management</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReaddUnsoldToAuction}
                disabled={auctionState.unsold.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-40 text-blue-400 font-bold text-xs rounded-lg border border-blue-500/20"
                title="Move all unsold players back onto the wheel"
              >
                <RotateCcw className="w-3 h-3" />
                Re-spin Unsold
              </button>
              <button
                onClick={handleClearCategory}
                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title="Clear category players"
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
                Currently in Auction ({auctionState.inAuction.length})
              </span>
              <span className="text-[11px] text-slate-400">On Wheel</span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {auctionState.inAuction.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No players currently on the wheel.</div>
              ) : (
                auctionState.inAuction.map((player) => (
                  <div key={player.id} className="p-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg">
                    <span className="text-xs font-bold text-slate-200">{player.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveToSold(player)}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                        title="Move to Sold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveToUnsold(player)}
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
                Sold ({auctionState.sold.length})
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {auctionState.sold.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No players marked sold yet.</div>
              ) : (
                auctionState.sold.map((player) => (
                  <div key={player.id} className="p-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg">
                    <div>
                      <div className="text-xs font-bold text-slate-200">{player.name}</div>
                      {player.team && (
                        <div className="text-[10px] text-emerald-400">
                          {player.team} {player.bidAmount ? `• ₹${player.bidAmount.toLocaleString()}` : ''}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleMoveBackToAuction(player)}
                      className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded"
                      title="Move back to In Auction"
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
                Unsold ({auctionState.unsold.length})
              </span>
              {auctionState.unsold.length > 0 && (
                <button
                  onClick={handleReaddUnsoldToAuction}
                  className="text-[10px] font-bold text-amber-400 hover:underline"
                >
                  Add all to Wheel
                </button>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {auctionState.unsold.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No unsold players in this round.</div>
              ) : (
                auctionState.unsold.map((player) => (
                  <div key={player.id} className="p-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg">
                    <span className="text-xs font-bold text-slate-200">{player.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveToSold(player)}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                        title="Move to Sold"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveBackToAuction(player)}
                        className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded"
                        title="Move back to In Auction"
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

      {/* Admin Winner Resolution Modal */}
      <WinnerModal
        player={auctionState.wheelState.selectedPlayer}
        isOpen={auctionState.wheelState.winnerModalOpen}
        isAdmin={true}
        teams={teams}
        onClose={() => {
          publishAuctionState({
            ...auctionState,
            wheelState: {
              ...auctionState.wheelState,
              winnerModalOpen: false,
            },
          });
        }}
        onMoveToSold={handleMoveToSold}
        onMoveToUnsold={handleMoveToUnsold}
      />

      {/* Settings Modal */}
      <ConfigModal isOpen={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
};
