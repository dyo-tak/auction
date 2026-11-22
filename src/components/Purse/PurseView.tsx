import React, { useEffect, useState, useMemo, useRef } from 'react';
import { TeamPurse } from '../../types';
import { fetchPurseData, getCachedPurse } from '../../services/sheets';
import { RefreshCw, Search, Users, Wallet, Trophy, CheckCircle, ExternalLink } from 'lucide-react';
import { getAppConfig } from '../../services/config';

interface PurseViewProps {
  tournament: 'men' | 'women';
}

export const PurseView: React.FC<PurseViewProps> = ({ tournament }) => {
  // Initialize immediately from local cache so the page NEVER flashes empty on refresh
  const [teams, setTeams] = useState<TeamPurse[]>(() => getCachedPurse(tournament));
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Cached');
  const [source, setSource] = useState<string>('google-sheets');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const isMounted = useRef<boolean>(true);

  // Sync with cached data whenever tournament tab changes
  useEffect(() => {
    setTeams(getCachedPurse(tournament));
  }, [tournament]);

  const loadData = async (showIndicator = false) => {
    if (showIndicator) {
      setIsRefreshing(true);
    }
    try {
      const result = await fetchPurseData(tournament);
      if (isMounted.current && result.teams && result.teams.length > 0) {
        setTeams(result.teams);
        setLastUpdated(result.lastUpdated);
        setSource(result.source);
      }
    } catch (e) {
      console.warn('Error refreshing purse:', e);
    } finally {
      if (isMounted.current && showIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    // Silent initial fetch (indicator = false so no flashing)
    loadData(false);
    const interval = setInterval(() => {
      loadData(false); // Silent 15s polling
    }, 15000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [tournament]);

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const query = searchQuery.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.slots.some(
          (s) =>
            s.playerName.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query)
        )
    );
  }, [teams, searchQuery]);

  const totalAllocated = useMemo(
    () => teams.reduce((acc, t) => acc + t.totalPurse, 0),
    [teams]
  );
  const totalSpent = useMemo(
    () => teams.reduce((acc, t) => acc + t.spent, 0),
    [teams]
  );
  const totalRemaining = totalAllocated - totalSpent;

  const config = getAppConfig();
  const sheetUrl = config.googleSheetId?.startsWith('http')
    ? config.googleSheetId
    : `https://docs.google.com/spreadsheets/d/${config.googleSheetId}/edit`;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg backdrop-blur">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-wide">
              {tournament === 'men' ? "Men's Tournament Purse" : "Women's Tournament Purse"}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                source === 'google-sheets'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {source === 'google-sheets' ? 'Live Google Sheet' : 'Tournament Data'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Last synced: {lastUpdated || 'Loading...'}</span>
            <span>•</span>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              Open Google Sheet <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team or player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 text-sm transition-all"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            Total Teams
          </div>
          <div className="text-2xl font-black text-white">{teams.length}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase mb-1">
            <Wallet className="w-4 h-4 text-amber-400" />
            Total Purse
          </div>
          <div className="text-2xl font-black text-amber-400">₹{totalAllocated.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase mb-1">
            <Trophy className="w-4 h-4 text-rose-400" />
            Total Spent
          </div>
          <div className="text-2xl font-black text-rose-400">₹{totalSpent.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Remaining Purse
          </div>
          <div className="text-2xl font-black text-emerald-400">₹{totalRemaining.toLocaleString()}</div>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeams.map((team) => {
          const spentPercent = Math.min(100, Math.round((team.spent / team.totalPurse) * 100));
          const acquiredCount = team.slots.filter(
            (s) => Boolean(s.playerName?.trim()) || s.bidAmount > 0
          ).length;

          return (
            <div
              key={team.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col"
            >
              {/* Team Header */}
              <div
                className="p-4 border-b border-slate-800"
                style={{
                  borderTop: `4px solid ${team.color || '#f59e0b'}`,
                  background: `linear-gradient(180deg, ${team.color}15 0%, transparent 100%)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: team.color }}
                      />
                      {team.name}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {acquiredCount} / {team.slots.length} Slots Filled
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase block">Remaining</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      ₹{team.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Spent Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Spent: ₹{team.spent.toLocaleString()}</span>
                    <span>{spentPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${spentPercent}%`,
                        backgroundColor: team.color || '#f59e0b',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Slots Table */}
              <div className="p-3 flex-1 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/80">
                      <th className="py-2 px-2.5 font-bold uppercase w-16">Cat.</th>
                      <th className="py-2 px-2.5 font-bold uppercase">Player Name</th>
                      <th className="py-2 px-2.5 font-bold uppercase text-right w-24">Bid (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {team.slots.map((slot, sIdx) => {
                      const hasName = Boolean(slot.playerName && slot.playerName.trim());
                      const hasBid = slot.bidAmount > 0;
                      const isAssigned = hasName || hasBid;

                      return (
                        <tr
                          key={sIdx}
                          className={isAssigned ? 'bg-slate-800/30' : 'opacity-70'}
                        >
                          <td className="py-2 px-2.5 font-bold text-slate-300">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                slot.category.toUpperCase() === 'CHIT'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {slot.category}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 font-medium text-slate-200">
                            {hasName ? (
                              <span className="text-amber-300 font-bold text-sm tracking-wide">
                                {slot.playerName}
                              </span>
                            ) : hasBid ? (
                              <span className="text-slate-400 italic font-semibold">
                                Player Pending
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs italic">
                                — Open Slot —
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-300">
                            {hasBid ? (
                              <span className="text-emerald-400">
                                ₹{slot.bidAmount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
