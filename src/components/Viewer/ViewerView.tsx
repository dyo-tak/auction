import React from 'react';
import { AuctionState } from '../../types';
import { WheelCanvas } from '../Wheel/WheelCanvas';
import { WinnerModal } from '../Wheel/WinnerModal';
import { Radio, Users, CheckCircle, XCircle } from 'lucide-react';

interface ViewerViewProps {
  auctionState: AuctionState;
  onCloseWinnerModal: () => void;
}

export const ViewerView: React.FC<ViewerViewProps> = ({ auctionState, onCloseWinnerModal }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Category & Live Ticker */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Live Auction Broadcast
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            {auctionState.currentCategory || 'Player Auction'}
          </h1>
        </div>

        {/* Quick Ticker Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>{auctionState.inAuction.length} on Wheel</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{auctionState.sold.length} Sold</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>{auctionState.unsold.length} Unsold</span>
          </div>
        </div>
      </div>

      {/* Main Wheel Stage */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
        {/* Stadium lighting glow effect in background */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="text-center mb-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            {auctionState.wheelState.isSpinning
              ? 'Wheel is spinning live...'
              : 'Waiting for auctioneer spin'}
          </span>
        </div>

        {/* Wheel Canvas (Viewer has no spin button, purely synced spectator) */}
        <div className="z-10">
          <WheelCanvas
            players={auctionState.inAuction}
            isSpinning={auctionState.wheelState.isSpinning}
            targetRotation={auctionState.wheelState.targetRotation}
            durationMs={auctionState.wheelState.durationMs}
            canSpin={false}
          />
        </div>
      </div>

      {/* Mobile-Friendly Category Activity Boards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recently Sold */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-3">
            <CheckCircle className="w-4 h-4" />
            Sold in this category ({auctionState.sold.length})
          </h3>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 text-xs">
            {auctionState.sold.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No players sold yet in this category.</p>
            ) : (
              auctionState.sold.map((player) => (
                <div key={player.id} className="py-2 flex items-center justify-between">
                  <span className="font-bold text-slate-200">{player.name}</span>
                  {player.team ? (
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      {player.team} {player.bidAmount ? `(₹${player.bidAmount.toLocaleString()})` : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 uppercase">Sold</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unsold */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
          <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5 mb-3">
            <XCircle className="w-4 h-4" />
            Unsold in this category ({auctionState.unsold.length})
          </h3>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 text-xs">
            {auctionState.unsold.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No unsold players currently.</p>
            ) : (
              auctionState.unsold.map((player) => (
                <div key={player.id} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-slate-300">{player.name}</span>
                  <span className="text-[10px] text-rose-400 font-bold uppercase">Unsold</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Winner Celebration Modal */}
      <WinnerModal
        player={auctionState.wheelState.selectedPlayer}
        isOpen={auctionState.wheelState.winnerModalOpen}
        isAdmin={false}
        onClose={onCloseWinnerModal}
      />
    </div>
  );
};
