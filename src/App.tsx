import { useEffect, useState } from 'react';
import { Player, TeamPurse } from './types';
import { fetchPurseData } from './services/sheets';
import { SAMPLE_PLAYERS_BY_CATEGORY } from './data/mockData';
import { Navbar, ActiveTab } from './components/Navbar';
import { PurseView } from './components/Purse/PurseView';
import { AdminPanel } from './components/Admin/AdminPanel';

const STORAGE_KEY = 'AUCTION_PERSISTED_STATE_V2';

interface PersistedAuctionState {
  currentCategory: string;
  inAuction: Player[];
  sold: Player[];
  unsold: Player[];
}

function getInitialAuctionState(): PersistedAuctionState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.inAuction)) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  // Default initial Category A players from ps.docx
  const cat = 'Category A';
  const defaultPlayers: Player[] = (SAMPLE_PLAYERS_BY_CATEGORY[cat] || []).map((name, i) => ({
    id: `p-${i}-${Date.now()}`,
    name,
    category: cat,
    status: 'inAuction',
  }));

  return {
    currentCategory: cat,
    inAuction: defaultPlayers,
    sold: [],
    unsold: [],
  };
}

export function App() {
  const [auctionData, setAuctionData] = useState<PersistedAuctionState>(getInitialAuctionState);
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.includes('/admin') || search.includes('admin') || hash.includes('admin');
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('purse-men');
  const [teams, setTeams] = useState<TeamPurse[]>([]);

  // Check URL routing on load and popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      const admin = path.includes('/admin') || search.includes('admin') || hash.includes('admin');
      setIsAdminRoute(admin);

      if (search.includes('purse-women') || hash.includes('purse-women')) {
        setActiveTab('purse-women');
      } else {
        setActiveTab('purse-men');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Save auction state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auctionData));
  }, [auctionData]);

  // Load teams for Admin winning modal dropdown
  useEffect(() => {
    fetchPurseData('men').then((res) => {
      if (res.teams && res.teams.length > 0) {
        setTeams(res.teams);
      }
    });
  }, []);

  // Navigation helpers
  const handleNavigateViewer = () => {
    setIsAdminRoute(false);
    const base = window.location.pathname.replace(/\/admin\/?$/, '') || '/auction/';
    window.history.pushState(null, '', base);
  };

  // Category & Player management
  const handleCategoryChange = (newCat: string) => {
    const defaultNames = SAMPLE_PLAYERS_BY_CATEGORY[newCat] || [];
    const newPlayers: Player[] = defaultNames.map((name, i) => ({
      id: `p-${newCat}-${i}-${Date.now()}`,
      name,
      category: newCat,
      status: 'inAuction',
    }));

    setAuctionData({
      currentCategory: newCat,
      inAuction: newPlayers,
      sold: [],
      unsold: [],
    });
  };

  const handleResetCategoryDefaults = (cat: string) => {
    const defaultNames = SAMPLE_PLAYERS_BY_CATEGORY[cat] || [];
    const newPlayers: Player[] = defaultNames.map((name, i) => ({
      id: `p-${cat}-${i}-${Date.now()}`,
      name,
      category: cat,
      status: 'inAuction',
    }));

    setAuctionData((prev) => ({
      ...prev,
      inAuction: newPlayers,
      sold: [],
      unsold: [],
    }));
  };

  const handleAddPlayers = (names: string[]) => {
    const newPlayers: Player[] = names.map((name) => ({
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name,
      category: auctionData.currentCategory,
      status: 'inAuction',
    }));

    setAuctionData((prev) => ({
      ...prev,
      inAuction: [...prev.inAuction, ...newPlayers],
    }));
  };

  const handleMoveToSold = (player: Player, teamName?: string, bidAmount?: number) => {
    const updatedInAuction = auctionData.inAuction.filter((p) => p.id !== player.id);
    const updatedUnsold = auctionData.unsold.filter((p) => p.id !== player.id);
    const soldPlayer: Player = {
      ...player,
      status: 'sold',
      team: teamName || player.team,
      bidAmount: bidAmount !== undefined ? bidAmount : player.bidAmount,
    };

    setAuctionData((prev) => ({
      ...prev,
      inAuction: updatedInAuction,
      unsold: updatedUnsold,
      sold: [soldPlayer, ...prev.sold],
    }));
  };

  const handleMoveToUnsold = (player: Player) => {
    const updatedInAuction = auctionData.inAuction.filter((p) => p.id !== player.id);
    const unsoldPlayer: Player = {
      ...player,
      status: 'unsold',
    };

    setAuctionData((prev) => ({
      ...prev,
      inAuction: updatedInAuction,
      unsold: [unsoldPlayer, ...prev.unsold],
    }));
  };

  const handleMoveBackToAuction = (player: Player) => {
    const updatedSold = auctionData.sold.filter((p) => p.id !== player.id);
    const updatedUnsold = auctionData.unsold.filter((p) => p.id !== player.id);
    const inAuctionPlayer: Player = {
      ...player,
      status: 'inAuction',
    };

    setAuctionData((prev) => ({
      ...prev,
      sold: updatedSold,
      unsold: updatedUnsold,
      inAuction: [...prev.inAuction, inAuctionPlayer],
    }));
  };

  const handleReaddUnsold = () => {
    if (auctionData.unsold.length === 0) return;
    const readded: Player[] = auctionData.unsold.map((p) => ({
      ...p,
      status: 'inAuction',
    }));

    setAuctionData((prev) => ({
      ...prev,
      inAuction: [...prev.inAuction, ...readded],
      unsold: [],
    }));
  };

  const handleClearCategory = () => {
    setAuctionData((prev) => ({
      ...prev,
      inAuction: [],
      sold: [],
      unsold: [],
    }));
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        isAdminRoute={isAdminRoute}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        onNavigateViewer={handleNavigateViewer}
      />

      <main className="flex-1 pb-12">
        {isAdminRoute ? (
          /* Wheel and all management only shown on Admin route (/auction/admin) */
          <AdminPanel
            currentCategory={auctionData.currentCategory}
            inAuction={auctionData.inAuction}
            sold={auctionData.sold}
            unsold={auctionData.unsold}
            teams={teams}
            onCategoryChange={handleCategoryChange}
            onAddPlayers={handleAddPlayers}
            onMoveToSold={handleMoveToSold}
            onMoveToUnsold={handleMoveToUnsold}
            onMoveBackToAuction={handleMoveBackToAuction}
            onReaddUnsold={handleReaddUnsold}
            onClearCategory={handleClearCategory}
            onResetCategoryDefaults={handleResetCategoryDefaults}
          />
        ) : (
          /* Viewer endpoint (/auction): Strictly displays Purse Men & Purse Women */
          <div>
            {activeTab === 'purse-men' && <PurseView tournament="men" />}
            {activeTab === 'purse-women' && <PurseView tournament="women" />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-center text-xs text-slate-500">
        <p>Cricket Auction 2026 • Live Team Purse Platform</p>
      </footer>
    </div>
  );
}

export default App;
