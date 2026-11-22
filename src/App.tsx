import { useEffect, useState } from 'react';
import { Player, TeamPurse } from './types';
import { fetchPurseData } from './services/sheets';
import { SAMPLE_PLAYERS_BY_CATEGORY } from './data/mockData';
import { Navbar, ActiveTab } from './components/Navbar';
import { ViewerView } from './components/Viewer/ViewerView';
import { PurseView } from './components/Purse/PurseView';
import { ConfigModal } from './components/Admin/ConfigModal';

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('wheel');
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);
  const [teams, setTeams] = useState<TeamPurse[]>([]);

  // Persist auction wheel state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auctionData));
  }, [auctionData]);

  // Load teams for dropdown
  useEffect(() => {
    fetchPurseData('men').then((res) => {
      setTeams(res.teams);
    });
  }, []);

  // Handle Category Change
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

  // Reset to default reference players for current category
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

  // Add players from Excel paste
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

  // Move to Sold
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

  // Move to Unsold
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

  // Move back to In Auction (Return to wheel)
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

  // Re-add all unsold to in auction
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

  // Clear current round
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
        onTabChange={(tab) => {
          if (tab === 'admin') {
            setConfigModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isFirebase={false}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'wheel' && (
          <ViewerView
            currentCategory={auctionData.currentCategory}
            inAuction={auctionData.inAuction}
            sold={auctionData.sold}
            unsold={auctionData.unsold}
            teams={teams}
            onCategoryChange={handleCategoryChange}
            onAddPlayers={handleAddPlayers}
            onSpinEnd={() => {}}
            onMoveToSold={handleMoveToSold}
            onMoveToUnsold={handleMoveToUnsold}
            onMoveBackToAuction={handleMoveBackToAuction}
            onReaddUnsold={handleReaddUnsold}
            onClearCategory={handleClearCategory}
            onResetCategoryDefaults={handleResetCategoryDefaults}
          />
        )}

        {activeTab === 'purse-men' && <PurseView tournament="men" />}

        {activeTab === 'purse-women' && <PurseView tournament="women" />}
      </main>

      {/* Settings Modal (available from navbar gear/admin button) */}
      <ConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-center text-xs text-slate-500">
        <p>Cricket Auction 2026 • Live Player Auction & Team Purse Platform</p>
      </footer>
    </div>
  );
}

export default App;
