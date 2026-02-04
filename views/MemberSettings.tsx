
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSchema } from '../context/SchemaContext';
import { User, Share2, FileCode, CheckCircle2, AlertCircle, ExternalLink, Play, Loader2, Globe, Camera, ChevronRight } from 'lucide-react';
import { Jobber } from '../types';

interface StatusMessage {
  message: string;
  type: 'success' | 'error';
}

const MemberSettings: React.FC = () => {
  const { user } = useAuth();
  const { jobbers, updateJobber, submitProof } = useData();
  const { attributes } = useSchema();
  const [activeTab, setActiveTab] = useState<'identity' | 'dynamic' | 'proof'>('identity');
  const [saveStatus, setSaveStatus] = useState<StatusMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobber = jobbers.find(j => j.id === user?.id);

  // Identity State
  const [identityForm, setIdentityForm] = useState({ 
    name: jobber?.name || '', 
    handle: jobber?.handle || '',
    avatar_url: jobber?.avatar_url || ''
  });
  
  // Dynamic Fields State
  const [dynamicForm, setDynamicForm] = useState<Record<string, any>>({});

  // Proof State
  const [proofForm, setProofForm] = useState({ title: '', niche: '', company: '', link: '', description: '', type: 'work' });

  useEffect(() => {
    if (jobber) {
      setIdentityForm({ 
        name: jobber.name, 
        handle: jobber.handle,
        avatar_url: jobber.avatar_url || ''
      });
      setDynamicForm(jobber.dynamicData || {});
    }
  }, [jobber]);

  const handleIdentitySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobber) return;
    setIsSubmitting(true);
    setSaveStatus(null);
    try {
      await updateJobber(jobber.id, { 
        name: identityForm.name, 
        handle: identityForm.handle,
        avatar_url: identityForm.avatar_url 
      });
      setSaveStatus({ message: 'Identity Synced', type: 'success' });
    } catch (err) {
      setSaveStatus({ message: 'Sync Failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleDynamicSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobber) return;
    setIsSubmitting(true);
    setSaveStatus(null);
    try {
      await updateJobber(jobber.id, { dynamicData: { ...jobber.dynamicData, ...dynamicForm } });
      setSaveStatus({ message: 'Profile Data Updated', type: 'success' });
    } catch (err) {
      setSaveStatus({ message: 'Sync Failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobber) return;
    setIsSubmitting(true);
    setSaveStatus(null);
    try {
      await submitProof(jobber.id, {
        title: proofForm.title,
        niche: proofForm.niche,
        company: proofForm.company,
        url: proofForm.link,
        description: proofForm.description,
        type: proofForm.type
      });
      setProofForm({ title: '', niche: '', company: '', link: '', description: '', type: 'work' });
      setSaveStatus({ message: 'Proof Logged to Queue', type: 'success' });
    } catch (err) {
      setSaveStatus({ message: 'Sync Failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const dynamicFields = attributes.filter(a => a.is_public && !['atis_score', 'rank', 'stars', 'category'].includes(a.key));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">Node Configuration</h1>
          <p className="text-zinc-500 text-[10px] md:text-sm font-mono uppercase tracking-wider">Operator Profile Management</p>
        </div>
        {saveStatus && (
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2 border shadow-lg ${
            saveStatus.type === 'error' 
              ? 'bg-red-500/10 border-red-500/30 text-red-500' 
              : 'bg-violet-500/10 border-violet-500/20 text-violet-500'
          }`}>
             {saveStatus.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />} 
             {saveStatus.message}
          </div>
        )}
      </div>

      <div className="flex border-b border-zinc-800 gap-4 md:gap-8 sticky top-0 bg-[#09090b] z-20 overflow-x-auto no-scrollbar">
        {[
          { id: 'identity', label: 'Identity', icon: <User className="w-4 h-4" /> },
          { id: 'dynamic', label: 'Details', icon: <Globe className="w-4 h-4" /> },
          { id: 'proof', label: 'Submission', icon: <FileCode className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest relative transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'text-violet-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"></div>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'identity' && (
          <form onSubmit={handleIdentitySave} className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 md:p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                <div className="relative group shrink-0">
                  <img 
                    src={identityForm.avatar_url || 'https://picsum.photos/200'} 
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-zinc-800 object-cover shadow-2xl transition-transform" 
                    alt="Avatar" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/200'; }}
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 w-full space-y-2">
                  <label className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Avatar Image URL</label>
                  <input 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 md:p-4 text-xs md:text-sm text-zinc-100 focus:border-violet-500/50 outline-none transition-all"
                    value={identityForm.avatar_url}
                    onChange={e => setIdentityForm({...identityForm, avatar_url: e.target.value})}
                    placeholder="https://resource.cdn/avatar.png"
                  />
                  <p className="text-[8px] text-zinc-600 font-mono italic pl-1">Direct link preferred.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Public Display Name</label>
                  <input 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-sm text-white focus:border-violet-500/50 outline-none"
                    value={identityForm.name}
                    onChange={e => setIdentityForm({...identityForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Handle (@username)</label>
                  <input 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-sm text-white focus:border-violet-500/50 outline-none font-mono"
                    value={identityForm.handle}
                    onChange={e => setIdentityForm({...identityForm, handle: e.target.value})}
                    required
                  />
                </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-4 bg-violet-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-violet-500 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Sync Operator Identity
            </button>
          </form>
        )}

        {activeTab === 'dynamic' && (
          <form onSubmit={handleDynamicSave} className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {dynamicFields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">{field.label}</label>
                    {field.data_type === 'richtext' ? (
                      <textarea 
                        rows={5}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-sm text-white focus:border-violet-500/50 outline-none resize-none leading-relaxed"
                        placeholder={`Enter ${field.label.toLowerCase()} details...`}
                        value={dynamicForm[field.key] || ''}
                        onChange={e => setDynamicForm({...dynamicForm, [field.key]: e.target.value})}
                      />
                    ) : (
                      <input 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-sm text-white focus:border-violet-500/50 outline-none"
                        placeholder={field.data_type === 'url' ? 'https://...' : `Enter ${field.label.toLowerCase()}...`}
                        value={dynamicForm[field.key] || ''}
                        onChange={e => setDynamicForm({...dynamicForm, [field.key]: e.target.value})}
                      />
                    )}
                  </div>
                ))}
            </div>
            {dynamicFields.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 uppercase tracking-[0.2em] text-[10px] font-mono">
                Awaiting Schema Vectors...
              </div>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 py-4 bg-violet-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-violet-500 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sync Profile Attributes
              </button>
            )}
          </form>
        )}

        {activeTab === 'proof' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 animate-in fade-in duration-300">
            <form onSubmit={handleProofSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Contribution Label</label>
                  <input required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-sm text-white focus:border-violet-500 outline-none transition-all" 
                    value={proofForm.title} onChange={e => setProofForm({...proofForm, title: e.target.value})} placeholder="e.g. Research Pipeline X" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Niche Vector</label>
                    <input required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-sm text-white focus:border-violet-500 outline-none transition-all" 
                      value={proofForm.niche} onChange={e => setProofForm({...proofForm, niche: e.target.value})} placeholder="Marketing" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Entity</label>
                    <input required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-sm text-white focus:border-violet-500 outline-none transition-all" 
                      value={proofForm.company} onChange={e => setProofForm({...proofForm, company: e.target.value})} placeholder="AXIS" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">External Resource Link</label>
                  <input required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-sm text-white focus:border-violet-500 outline-none transition-all" 
                    value={proofForm.link} onChange={e => setProofForm({...proofForm, link: e.target.value})} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase tracking-widest pl-1">Impact Description</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 md:p-4 text-sm text-white focus:border-violet-500 outline-none resize-none leading-relaxed"
                    placeholder="Provide proof of impact..."
                    value={proofForm.description}
                    onChange={e => setProofForm({...proofForm, description: e.target.value})}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-violet-600 text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-violet-500 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10 active:scale-[0.98]"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Commit to Neural Grading
                </button>
            </form>

            <div className="p-8 md:p-10 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 bg-zinc-900/10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                  <FileCode className="w-8 h-8 md:w-10 md:h-10 text-violet-500/50" />
                </div>
                <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Security Advisory</h3>
                <p className="text-[9px] md:text-[10px] text-zinc-600 font-mono uppercase leading-relaxed max-w-xs">
                  All submissions are analyzed by the AI Evaluation Pipeline. Fraudulent or spam proofs will trigger automatic reputation slashing.
                </p>
                <div className="flex items-center gap-1.5 text-[8px] font-mono text-violet-500/50">
                   <ChevronRight className="w-3 h-3" />
                   READING ENCRYPTED BYTES
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberSettings;
