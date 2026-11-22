import React from 'react';
import { Disc3, Wallet, ShieldCheck, Eye, Wifi, WifiOff } from 'lucide-react';

export type ActiveTab = 'wheel' | 'purse-men' | 'purse-women' | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isFirebase: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, isFirebase }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo / Title */}
          <div
            onClick={() => onTabChange('wheel')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md">
              🏏
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-wide text-white block leading-none">
                AUCTION <span className="text-amber-400">2026</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block mt-0.5">
                Player Auction
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => onTabChange('wheel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'wheel'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Disc3 className="w-4 h-4" />
              Spin the Wheel
            </button>

            <button
              onClick={() => onTabChange('purse-men')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'purse-men'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Purse Men
            </button>

            <button
              onClick={() => onTabChange('purse-women')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'purse-women'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Purse Women
            </button>
          </nav>

          {/* Right Action: Sync status & Admin View Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isFirebase
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
              title={isFirebase ? 'Connected to Firebase Realtime Database' : 'Operating in local browser sync mode'}
            >
              {isFirebase ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isFirebase ? 'RTDB Sync' : 'Local Sync'}</span>
            </div>

            {/* Admin toggle button */}
            {activeTab === 'admin' ? (
              <button
                onClick={() => onTabChange('wheel')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Viewer View</span>
              </button>
            ) : (
              <button
                onClick={() => onTabChange('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 gap-1">
          <button
            onClick={() => onTabChange('wheel')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'wheel'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            Wheel
          </button>

          <button
            onClick={() => onTabChange('purse-men')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'purse-men'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Purse Men
          </button>

          <button
            onClick={() => onTabChange('purse-women')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'purse-women'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Purse Women
          </button>
        </div>
      </div>
    </header>
  );
};
