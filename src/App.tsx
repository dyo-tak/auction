import { useEffect, useState, useTransition } from 'react';
import { AuctionState, TeamPurse } from './types';
import {
  subscribeToAuctionState,
  DEFAULT_AUCTION_STATE,
  isFirebaseConnected,
  publishAuctionState,
} from './services/firebase';
import { fetchPurseData } from './services/sheets';
import { Navbar, ActiveTab } from './components/Navbar';
import { ViewerView } from './components/Viewer/ViewerView';
import { PurseView } from './components/Purse/PurseView';
import { AdminPanel } from './components/Admin/AdminPanel';

export function App() {
  const [auctionState, setAuctionState] = useState<AuctionState>(DEFAULT_AUCTION_STATE);
  const [activeTab, setActiveTab] = useState<ActiveTab>('wheel');
  const [isFirebase, setIsFirebase] = useState<boolean>(false);
  const [teams, setTeams] = useState<TeamPurse[]>([]);
  const [, startTransition] = useTransition();

  // Route detection (handles /auction, /auction/admin, ?tab=admin, #admin)
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path.includes('/admin') || search.includes('admin') || hash.includes('admin')) {
        setActiveTab('admin');
      } else if (search.includes('purse-men') || hash.includes('purse-men')) {
        setActiveTab('purse-men');
      } else if (search.includes('purse-women') || hash.includes('purse-women')) {
        setActiveTab('purse-women');
      } else {
        setActiveTab('wheel');
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // Update browser URL on tab change without full reload
  const handleTabChange = (tab: ActiveTab) => {
    startTransition(() => {
      setActiveTab(tab);
      const baseUrl = window.location.pathname.replace(/\/admin\/?$/, '');
      const newPath = tab === 'admin' ? `${baseUrl}/admin` : baseUrl;
      window.history.pushState(null, '', newPath);
    });
  };

  // Subscribe to real-time auction state
  useEffect(() => {
    const unsubscribe = subscribeToAuctionState((newState) => {
      setAuctionState(newState);
      setIsFirebase(isFirebaseConnected());
    });

    const handleConfigUpdate = () => {
      setIsFirebase(isFirebaseConnected());
    };
    window.addEventListener('auction-config-updated', handleConfigUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('auction-config-updated', handleConfigUpdate);
    };
  }, []);

  // Preload teams for admin dropdown
  useEffect(() => {
    fetchPurseData('men').then((res) => {
      setTeams(res.teams);
    });
  }, []);

  const handleCloseWinnerModal = () => {
    publishAuctionState({
      ...auctionState,
      wheelState: {
        ...auctionState.wheelState,
        winnerModalOpen: false,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isFirebase={isFirebase}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'wheel' && (
          <ViewerView
            auctionState={auctionState}
            onCloseWinnerModal={handleCloseWinnerModal}
          />
        )}

        {activeTab === 'purse-men' && <PurseView tournament="men" />}

        {activeTab === 'purse-women' && <PurseView tournament="women" />}

        {activeTab === 'admin' && (
          <AdminPanel auctionState={auctionState} teams={teams} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <p>
          Cricket Auction 2026 • Live Sync Platform • Hosted on GitHub Pages
        </p>
      </footer>
    </div>
  );
}

export default App;
