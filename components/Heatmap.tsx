
import React, { useMemo } from 'react';
import { Contribution, Proof } from '../types';

interface HeatmapProps {
  contributions: Contribution[];
  proofs?: Proof[];
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const Heatmap: React.FC<HeatmapProps> = ({ contributions, proofs = [] }) => {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const data = new Map<string, number>();

    // Aggregate activity from both contributions and proofs
    contributions.forEach(c => {
      const dateKey = new Date(c.occurred_at).toISOString().split('T')[0];
      data.set(dateKey, (data.get(dateKey) || 0) + 1);
    });

    proofs.forEach(p => {
      const dateKey = new Date(p.created_at).toISOString().split('T')[0];
      data.set(dateKey, (data.get(dateKey) || 0) + 1);
    });

    // Generate 12 months leading up to today
    const monthsArray = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      
      // Calculate days in this month
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday

      const days = [];
      // Padding for the start of the month to align with week rows (Sun-Sat)
      for (let p = 0; p < firstDayOfWeek; p++) {
        days.push({ padding: true });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const currentDate = new Date(year, monthIndex, d);
        const dateKey = currentDate.toISOString().split('T')[0];
        const count = data.get(dateKey) || 0;
        const isFuture = currentDate > today;
        days.push({ count, dateKey, isFuture, padding: false });
      }

      monthsArray.push({
        name: MONTHS[monthIndex],
        year,
        days
      });
    }

    return monthsArray;
  }, [contributions, proofs]);

  const getColor = (count: number, isFuture: boolean) => {
    if (isFuture) return 'bg-transparent border border-zinc-900/30';
    if (count === 0) return 'bg-zinc-900/40';
    if (count === 1) return 'bg-violet-900/40';
    if (count === 2) return 'bg-violet-700/60';
    if (count >= 3) return 'bg-violet-500';
    return 'bg-zinc-900/40';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Temporal Contribution Matrix</h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">Proof-of-Work Distribution (12 Months)</p>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-zinc-600 font-mono bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-zinc-900 rounded-[1px]"></div>
            <span>None</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-violet-500 rounded-[1px]"></div>
            <span>High Impact</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {heatmapData.map((month, mIdx) => (
          <div key={`${month.name}-${month.year}`} className="p-3 bg-zinc-900/20 border border-zinc-800/50 rounded-xl flex flex-col">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-[10px] font-black text-zinc-200 tracking-tighter">{month.name}</span>
              <span className="text-[8px] text-zinc-600 font-mono">{month.year}</span>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {/* Day Labels for the first month only or all for clarity? Let's do a tiny header */}
              {['S','M','T','W','T','F','S'].map(d => (
                <div key={d} className="text-[7px] text-zinc-700 font-bold text-center mb-1">{d}</div>
              ))}
              
              {month.days.map((day, dIdx) => (
                day.padding ? (
                  <div key={`pad-${dIdx}`} className="w-full aspect-square opacity-0"></div>
                ) : (
                  <div 
                    key={day.dateKey} 
                    className={`w-full aspect-square rounded-[2px] transition-all hover:scale-110 hover:shadow-lg hover:shadow-violet-500/20 ${getColor(day.count || 0, day.isFuture || false)}`}
                    title={day.isFuture ? 'Future Vector' : `${day.count} proofs on ${day.dateKey}`}
                  ></div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg">
         <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></div>
         <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
           Tracing active nodes across 12-month epoch. Sequential logic synchronized.
         </p>
      </div>
    </div>
  );
};

export default Heatmap;
