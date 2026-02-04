
import React from 'react';
import { useData } from '../context/DataContext';
import { Severity } from '../types';
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, Clock, Server, ShieldCheck, Lock, Globe } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { events, jobbers } = useData();

  const getSeverityColor = (sev: Severity) => {
    switch(sev) {
      case Severity.HIGH: return 'text-rose-500';
      case Severity.MEDIUM: return 'text-amber-500';
      case Severity.LOW: return 'text-violet-500';
      default: return 'text-zinc-500';
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'submission': return <CheckCircle2 className="w-4 h-4" />;
      case 'grade_change': return <TrendingUp className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const stats = [
    { label: 'Active Jobbers', val: jobbers.length, change: '+0', trend: 'neutral' },
    { label: 'Avg ATIS', val: jobbers.length > 0 ? Math.round(jobbers.reduce((a,b)=>a+b.atis_score, 0)/jobbers.length) : 0, change: '0', trend: 'neutral' },
    { label: 'Pending Proofs', val: jobbers.reduce((a,b)=>a+(b.proofs?.filter(p=>p.status==='pending').length || 0),0), change: '0', trend: 'neutral' },
    { label: 'System Health', val: '99.9%', change: 'stable', trend: 'neutral' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">Situation Room</h1>
          <p className="text-zinc-500 text-[10px] md:text-sm font-mono uppercase tracking-wider">Real-time Telemetry Control</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Encrypted Uplink</span>
           </div>
           <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
             <Server className="w-5 h-5 text-violet-500" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-zinc-900/30 border border-zinc-800 p-4 md:p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-[8px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2 truncate">{s.label}</div>
            <div className="flex items-end justify-between gap-1">
              <div className="text-xl md:text-3xl font-bold text-white">{s.val}</div>
              <div className={`text-[8px] md:text-[10px] font-mono hidden sm:block ${s.trend === 'up' ? 'text-violet-500' : s.trend === 'down' ? 'text-rose-500' : 'text-zinc-500'}`}>
                {s.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
           <div className="flex items-center justify-between sticky top-0 bg-[#09090b] py-2 z-10">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
                <h2 className="font-bold text-white uppercase tracking-wider text-xs md:text-sm">Global Event Stream</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                <span className="text-[9px] md:text-[10px] text-zinc-500 font-mono">LIVE FEED</span>
              </div>
           </div>

           <div className="space-y-3 md:space-y-4">
              {events.length === 0 ? (
                <div className="py-12 md:py-20 text-center border border-zinc-800 rounded-xl text-zinc-600 font-mono uppercase tracking-widest text-[10px] md:text-xs">
                  Awaiting Data Packet...
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="p-3 md:p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg flex gap-3 md:gap-4 animate-in slide-in-from-left duration-500">
                    <div className={`mt-1 shrink-0 ${getSeverityColor(event.severity)}`}>
                      {getIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 mb-1">
                        <span className="text-xs md:text-sm font-medium text-white line-clamp-2">{event.message}</span>
                        <span className="text-[8px] md:text-[10px] text-zinc-600 font-mono shrink-0">{new Date(event.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-[8px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest truncate">
                        {event.type} • {event.related_jobber_id || 'SYSTEM_CORE'}
                      </div>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        <div className="space-y-4 md:space-y-6 lg:border-l lg:border-zinc-800 lg:pl-8">
           <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
              <h2 className="font-bold text-white uppercase tracking-wider text-xs md:text-sm">Network Integrity</h2>
           </div>

           <div className="space-y-4">
              <div className="p-5 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Secure AI Gateway</span>
                    <span className="text-[10px] font-mono text-emerald-500">ACTIVE</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">E2E Messaging</span>
                    <span className="text-[10px] font-mono text-emerald-500">VERIFIED</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">30D Rolling Purge</span>
                    <span className="text-[10px] font-mono text-violet-500">STANDBY</span>
                 </div>
                 <div className="pt-2">
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                       <div className="h-full bg-violet-600 w-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-lg">
                 <div className="text-[8px] font-bold uppercase tracking-widest text-violet-500 mb-2 flex items-center gap-2"><Globe className="w-3 h-3" /> Security Protocol</div>
                 <div className="text-[11px] text-zinc-400 font-light italic leading-relaxed">
                   Neural Keys are proxied via secure Edge Functions. Your private API credentials never leave the core server environment.
                 </div>
              </div>

              {jobbers.filter(j => j.status !== 'active').length > 0 && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg animate-pulse">
                  <div className="text-[8px] font-bold uppercase tracking-widest text-rose-500 mb-2">Protocol Flags</div>
                  <div className="text-[11px] text-zinc-300 font-medium">Multiple nodes reporting irregular trust modifiers. Review recommended.</div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
