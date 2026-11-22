import React from 'react';
import { Wallet, Eye, Disc3 } from 'lucide-react';

export type ActiveTab = 'purse-men' | 'purse-women' | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  isAdminRoute: boolean;
  onTabChange: (tab: ActiveTab) => void;
  onNavigateViewer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  isAdminRoute,
  onTabChange,
  onNavigateViewer,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo / Title */}
          <div
            onClick={isAdminRoute ? onNavigateViewer : () => onTabChange('purse-men')}
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
                {isAdminRoute ? 'Admin Wheel Control' : 'Team Purses & Squads'}
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          {isAdminRoute ? (
            /* Admin view header: Wheel badge and link back to public view */
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-lg">
                <Disc3 className="w-3.5 h-3.5" />
                Admin Wheel Panel
              </span>

              <button
                onClick={onNavigateViewer}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>View Public Purses</span>
              </button>
            </div>
          ) : (
            /* Public Viewer header: Strictly Purse Men & Purse Women (NO admin wheel button) */
            <div className="flex items-center gap-2 sm:gap-4">
              <nav className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => onTabChange('purse-men')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'purse-women'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Purse Women
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Mobile Navigation Bar for Viewers: Only Purse Men & Purse Women */}
        {!isAdminRoute && (
          <div className="flex sm:hidden items-center justify-around py-2 border-t border-slate-800/80 gap-2">
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
        )}
      </div>
    </header>
  );
};
