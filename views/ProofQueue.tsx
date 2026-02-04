
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Filter, Calendar, Tag, ExternalLink, CheckCircle2, Clock } from 'lucide-react';

const ProofQueue: React.FC = () => {
  const { jobbers } = useData();
  const [nicheFilter, setNicheFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  // ISSUE 6 FIX: Use useMemo to avoid expensive sorting/filtering on every render
  const filteredProofs = useMemo(() => {
    const all = jobbers.flatMap(j => 
      (j.proofs || []).map(p => ({ ...p, jobberName: j.name, jobberHandle: j.handle }))
    );

    return all
      .filter(p => nicheFilter === 'ALL' || p.niche === nicheFilter)
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return dateFilter === 'NEWEST' ? timeB - timeA : timeA - timeB;
      });
  }, [jobbers, nicheFilter, dateFilter]);

  const niches = useMemo(() => {
    const allNiches = jobbers.flatMap(j => (j.proofs || []).map(p => p.niche).filter(Boolean));
    return Array.from(new Set(allNiches));
  }, [jobbers]);

  return (
    <div className="p-8 space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Proof Aggregator</h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-wider">{filteredProofs.length} Active Records</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
             <div className="relative px-3 flex items-center gap-2 border-r border-zinc-800">
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                <select className="bg-transparent text-xs font-bold text-zinc-300 focus:outline-none appearance-none pr-4" value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}>
                  <option value="ALL">All Niches</option>
                  {niches.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
             </div>
             <div className="relative px-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <select className="bg-transparent text-xs font-bold text-zinc-300 focus:outline-none appearance-none pr-4" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)}>
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                </select>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredProofs.length === 0 ? (
          <div className="py-20 text-center border border-zinc-800 rounded-xl text-zinc-600 uppercase font-mono text-[10px]">No proofs match criteria</div>
        ) : filteredProofs.map((proof, idx) => (
          <div key={`${proof.id}-${idx}`} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:border-zinc-700 transition-all">
             <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded">{proof.niche || 'General'}</span>
                   <span className="text-[10px] text-zinc-600 font-mono">{new Date(proof.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{proof.title}</h3>
                <div className="flex items-center gap-2">
                   <span className="text-xs text-zinc-500 font-mono">By {proof.jobberName} ({proof.jobberHandle})</span>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <div className="text-right">
                   <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-1">Status</div>
                   <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                      {proof.status === 'scored' ? <><CheckCircle2 className="w-3.5 h-3.5 text-violet-500" /><span className="text-violet-500">Validated</span></> : <><Clock className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-500">Pending Review</span></>}
                   </div>
                </div>
                <a href={proof.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
                  <ExternalLink className="w-5 h-5" />
                </a>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProofQueue;
