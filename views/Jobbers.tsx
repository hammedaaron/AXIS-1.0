
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Rank, Jobber } from '../types';
import { LayoutGrid, List, Filter, ChevronRight, Star } from 'lucide-react';
import { RANK_COLORS } from '../constants';

interface JobbersProps {
  onSelect: (jobber: Jobber) => void;
}

const Jobbers: React.FC<JobbersProps> = ({ onSelect }) => {
  const { jobbers } = useData();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterRank, setFilterRank] = useState<Rank | 'ALL'>('ALL');

  const filtered = jobbers.filter(j => filterRank === 'ALL' || j.rank === filterRank);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">Talent Ledger</h1>
          <p className="text-zinc-500 text-[10px] md:text-sm font-mono uppercase tracking-wider">{filtered.length} active operators</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-violet-400' : 'text-zinc-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-violet-400' : 'text-zinc-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <select 
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-[11px] font-bold text-zinc-300 focus:outline-none appearance-none cursor-pointer uppercase tracking-widest"
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value as any)}
            >
              <option value="ALL">ALL RANKS</option>
              {Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Card List (Visible only on small screens) */}
      <div className="md:hidden space-y-3">
        {filtered.map(jobber => (
          <div 
            key={jobber.id}
            onClick={() => onSelect(jobber)}
            className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
               <img src={jobber.avatar_url} className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shadow-xl" />
               <div>
                 <h3 className="text-sm font-bold text-white mb-0.5">{jobber.name}</h3>
                 <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${RANK_COLORS[jobber.rank]}`}>
                      {jobber.rank}
                    </span>
                    <span className="text-[10px] text-violet-500 font-mono font-bold">{jobber.atis_score}</span>
                 </div>
               </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-700" />
          </div>
        ))}
      </div>

      {/* PC Table / Grid View (Hidden on mobile) */}
      <div className="hidden md:block">
        {viewMode === 'list' ? (
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-900/40">
                <tr className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest border-b border-zinc-800">
                  <th className="px-8 py-5 font-bold">Node Identity</th>
                  <th className="px-8 py-5 font-bold">Reputation Rank</th>
                  <th className="px-8 py-5 font-bold">ATIS Scoring</th>
                  <th className="px-8 py-5 font-bold text-right">Synchronization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filtered.map((jobber) => (
                  <tr key={jobber.id} onClick={() => onSelect(jobber)} className="hover:bg-violet-600/5 cursor-pointer transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <img src={jobber.avatar_url} className="w-10 h-10 rounded-lg border border-zinc-800 group-hover:border-violet-500/50 transition-colors" />
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">{jobber.name}</div>
                          <div className="text-[10px] text-zinc-600 font-mono">{jobber.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.15em] border ${RANK_COLORS[jobber.rank]}`}>
                        {jobber.rank}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-violet-500 font-mono">{jobber.atis_score}</div>
                        <div className="w-12 h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-600" style={{ width: `${Math.min(jobber.atis_score / 500 * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right text-[10px] text-zinc-600 font-mono">
                      {new Date(jobber.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((jobber) => (
              <div 
                key={jobber.id} 
                onClick={() => onSelect(jobber)}
                className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:border-violet-500/40 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                   <Star className={`w-4 h-4 ${jobber.atis_score > 300 ? 'text-amber-500 fill-amber-500' : 'text-zinc-800'}`} />
                </div>
                <div className="flex items-center gap-5 mb-6">
                  <img src={jobber.avatar_url} className="w-16 h-16 rounded-2xl border border-zinc-800 shadow-2xl group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <h3 className="text-white font-black tracking-tight group-hover:text-violet-400 truncate">{jobber.name}</h3>
                    <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">{jobber.handle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/50 text-center">
                    <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-1">ATIS</div>
                    <div className="text-lg font-bold text-violet-500 font-mono">{jobber.atis_score}</div>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center">
                    <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Rank</div>
                    <div className={`text-[9px] font-black uppercase tracking-tighter ${RANK_COLORS[jobber.rank].split(' ')[0]}`}>{jobber.rank}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="py-32 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
          <p className="text-zinc-700 font-mono uppercase tracking-[0.3em] text-xs">No personnel records found in this vector.</p>
        </div>
      )}
    </div>
  );
};

export default Jobbers;
