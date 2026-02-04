
import React, { useState, useEffect, useRef } from 'react';
import { X, Star, TrendingUp, Loader2, ChevronLeft, ShieldCheck, AlertTriangle, UserPlus, Lock, ShieldAlert } from 'lucide-react';
import { Jobber, Role, Severity } from '../types';
import { useData } from '../context/DataContext';
import { useSchema } from '../context/SchemaContext';
import { useAuth } from '../context/AuthContext';
import { RANK_COLORS } from '../constants';
import Heatmap from './Heatmap';
import { rateProofText } from '../services/geminiService';

interface ProfileDrawerProps {
  jobber: Jobber | null;
  onClose: () => void;
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ jobber, onClose }) => {
  const { updateJobber, scoreProof, addEvent, refreshJobberData } = useData();
  const { attributes, sections } = useSchema();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'proof' | 'contributions' | 'governance'>('profile');
  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (jobber && jobber.proofs.length === 0) {
      setIsFetchingData(true);
      refreshJobberData(jobber.id).finally(() => setIsFetchingData(false));
    }
  }, [jobber?.id]);

  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [activeTab]);

  if (!jobber) return null;

  const handleScoreProof = async (proofId: string) => {
    const proof = jobber.proofs.find(p => p.id === proofId);
    if (!proof) return;
    setLoadingAi(proofId);
    try {
      const score = await rateProofText(proof.title);
      await scoreProof(jobber.id, proofId, score);
      addEvent('grade_change', `AI Evaluated: ${proof.title}`, Severity.LOW, jobber.id);
    } finally {
      setLoadingAi(null);
    }
  };

  const handleRoleChange = async (newRole: Role) => {
    if (!isAdmin || jobber.id === user?.id) return;
    
    // Strict Hierarchical Guard
    if (user?.role === Role.ADMIN) {
      // Admin cannot touch a Super Admin
      if (jobber.role === Role.SUPER_ADMIN) {
        alert("ACCESS VIOLATION: Architect-tier nodes are immutable to your clearance level.");
        return;
      }
      // Admin cannot promote anyone to Super Admin
      if (newRole === Role.SUPER_ADMIN) {
        alert("PERMISSION DENIED: You lack authorization to grant Architect privileges.");
        return;
      }
    }

    setIsUpdatingRole(true);
    try {
      await updateJobber(jobber.id, { role: newRole });
      addEvent('grade_change', `Privilege Transition: ${jobber.name} elevated to ${newRole}`, Severity.HIGH, user?.id);
    } catch (err) {
      console.error("Governance Update Failed:", err);
      alert("Relay error: Database rejected role change. Ensure SQL constraints are updated.");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;
  const isAdmin = isSuperAdmin || user?.role === Role.ADMIN;
  
  // Logic: Can current user manage this target?
  const canManageTarget = isSuperAdmin || (user?.role === Role.ADMIN && jobber.role !== Role.SUPER_ADMIN);

  // Available Roles based on hierarchy
  // Tier 0 (Super Admin) sees everything. 
  // Tier 1 (Admin) only sees Jobber and Admin.
  const roleOptions = isSuperAdmin 
    ? [Role.JOBBER, Role.ADMIN, Role.SUPER_ADMIN] 
    : [Role.JOBBER, Role.ADMIN];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div ref={scrollContainerRef} className="relative w-full md:max-w-2xl bg-[#09090b] border-l border-zinc-800 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-8 border-b border-zinc-800 flex items-center justify-between md:block shrink-0 sticky top-0 bg-[#09090b] z-30">
          <button onClick={onClose} className="md:absolute md:top-6 md:right-6 text-zinc-500 hover:text-white flex items-center gap-1 md:block">
            <ChevronLeft className="w-5 h-5 md:hidden" />
            <X className="hidden md:block" />
          </button>
          <div className="flex items-center md:items-start gap-4 md:gap-6 mt-0 md:mt-4">
            <img src={jobber.avatar_url || 'https://picsum.photos/200'} className="w-12 h-12 md:w-24 md:h-24 rounded-xl border border-zinc-800 object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                <h2 className="text-lg md:text-2xl font-bold text-white truncate">{jobber.name}</h2>
                <span className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-widest border ${RANK_COLORS[jobber.rank]}`}>{jobber.rank}</span>
                {jobber.role !== Role.JOBBER && (
                  <span className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border ${jobber.role === Role.SUPER_ADMIN ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-violet-600/20 text-violet-400 border-violet-500/30'}`}>
                    <ShieldCheck className="w-3 h-3" /> {jobber.role}
                  </span>
                )}
              </div>
              <p className="text-zinc-500 font-mono text-[10px] md:text-sm">{jobber.handle}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-8 border-b border-zinc-800 sticky top-[73px] md:top-[161px] bg-[#09090b] z-20 flex gap-4 md:gap-8 overflow-x-auto no-scrollbar shrink-0">
          {['profile', 'proof', 'contributions', 'governance'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              disabled={(tab === 'governance' && !isAdmin)} 
              className={`py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-widest relative whitespace-nowrap ${activeTab === tab ? 'text-violet-500' : 'text-zinc-500 hover:text-zinc-300 disabled:opacity-30'}`}
            >
              {tab === 'governance' ? 'Governance' : tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"></div>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 md:p-8 flex-1">
          {isFetchingData ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Accessing Operator Logs...</span>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && (
                <div className="space-y-8 md:space-y-12">
                  {sections.map(section => (
                    <div key={section.id} className="space-y-4 md:space-y-6">
                      <h3 className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] border-b border-zinc-800 pb-2">{section.section_name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {section.contained_attribute_keys.map(key => {
                          const attr = attributes.find(a => a.key === key);
                          if (!attr || !attr.is_public) return null;
                          return (
                            <div key={key} className="space-y-2">
                              <label className="text-[8px] md:text-[10px] text-zinc-600 font-mono uppercase tracking-wider">{attr.label}</label>
                              <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg text-xs md:text-sm text-zinc-300">{jobber.dynamicData?.[key] || `N/A`}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'proof' && (
                <div className="space-y-4">
                  {jobber.proofs.length === 0 ? <p className="text-center py-10 text-zinc-600 text-[10px] uppercase font-mono">No proofs archived</p> : jobber.proofs.map(proof => (
                    <div key={proof.id} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="font-medium text-sm text-zinc-100">{proof.title}</div>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${proof.status === 'scored' ? 'bg-violet-500/10 text-violet-500' : 'bg-zinc-800 text-zinc-500'}`}>{proof.status}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < proof.admin_score ? 'fill-current' : 'opacity-20'}`} />)}
                        </div>
                        {isAdmin && proof.status !== 'scored' && (
                          <button onClick={() => handleScoreProof(proof.id)} disabled={loadingAi === proof.id} className="text-[9px] font-bold uppercase px-3 py-2 bg-violet-600 text-white rounded-md flex items-center gap-2">
                            {loadingAi === proof.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'AI EVAL'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'contributions' && <Heatmap contributions={jobber.contributions || []} proofs={jobber.proofs || []} />}
              {activeTab === 'governance' && isAdmin && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className={`p-6 border rounded-2xl space-y-4 relative overflow-hidden ${canManageTarget ? 'bg-rose-500/5 border-rose-500/20 shadow-lg' : 'bg-zinc-950 border-zinc-800'}`}>
                     <div className="absolute top-0 right-0 p-3 opacity-10">
                        {canManageTarget ? <UserPlus className="w-12 h-12" /> : <Lock className="w-12 h-12" />}
                     </div>
                     <div className="flex items-center gap-3">
                        <ShieldAlert className={`w-5 h-5 ${canManageTarget ? 'text-rose-500' : 'text-zinc-600'}`} />
                        <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${canManageTarget ? 'text-rose-500' : 'text-zinc-600'}`}>
                          {canManageTarget ? 'Operational Clearance Control' : 'Integrity Lock: ARCHITECT Tier'}
                        </h3>
                     </div>
                     
                     <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900/50 space-y-4">
                        {!canManageTarget ? (
                          <div className="flex flex-col items-center gap-4 py-6">
                             <Lock className="w-8 h-8 text-zinc-800" />
                             <p className="text-[10px] text-zinc-500 font-mono text-center leading-relaxed">
                               This node is categorized as <span className="text-amber-500 font-bold">SYSTEM ARCHITECT</span>. 
                               Your clearance tier is insufficient to modify these credentials.
                             </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-[10px] text-zinc-600 font-mono leading-relaxed">
                              Assigning new operational clearance tiers. This action will be logged in the system telemetry.
                            </p>
                            
                            <div className="grid grid-cols-1 gap-2">
                               {roleOptions.map(roleOption => (
                                 <button
                                   key={roleOption}
                                   disabled={isUpdatingRole || jobber.role === roleOption || jobber.id === user?.id}
                                   onClick={() => handleRoleChange(roleOption)}
                                   className={`w-full py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all flex items-center justify-between ${
                                     jobber.role === roleOption 
                                       ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' 
                                       : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                                   } disabled:opacity-30 disabled:grayscale`}
                                 >
                                   <div className="flex items-center gap-3">
                                      <ShieldCheck className={`w-4 h-4 ${jobber.role === roleOption ? 'text-white' : 'text-zinc-700'}`} />
                                      {roleOption}
                                   </div>
                                   {jobber.role === roleOption && <div className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded">ACTIVE</div>}
                                   {isUpdatingRole && jobber.role !== roleOption && <Loader2 className="w-3 h-3 animate-spin" />}
                                 </button>
                               ))}
                            </div>
                          </>
                        )}
                     </div>
                  </div>

                  {canManageTarget && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                      <div className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                        <h3 className="font-bold uppercase text-[10px] text-zinc-500 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Personnel Justification</h3>
                        <textarea 
                          className="w-full bg-transparent border-none text-zinc-300 text-xs focus:ring-0 p-0 h-24 italic leading-relaxed font-light placeholder:text-zinc-800" 
                          placeholder="Log governance override reasoning..." 
                          defaultValue={jobber.justification || ''} 
                          onBlur={(e) => updateJobber(jobber.id, { justification: e.target.value })} 
                        />
                      </div>
                      
                      <div className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Reputation Modifier</label>
                          <span className={`text-xs font-bold font-mono ${jobber.trust_modifier >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {jobber.trust_modifier > 0 ? '+' : ''}{jobber.trust_modifier}
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="-20" 
                          max="20" 
                          step="1" 
                          defaultValue={jobber.trust_modifier} 
                          onChange={(e) => updateJobber(jobber.id, { trust_modifier: parseInt(e.target.value) })} 
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;
