
import React, { useState, useEffect } from 'react';
import { useSchema } from '../context/SchemaContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Plus, Eye, EyeOff, Trash2, Shield, Layout, User, Loader2, Save, CheckCircle2, Megaphone, Trash } from 'lucide-react';
import { Attribute } from '../types';

const Settings: React.FC = () => {
  const { attributes, addField, hideField, nukeField, isLoading: isSchemaLoading } = useSchema();
  const { user } = useAuth();
  const { jobbers, updateJobber } = useData();
  
  const [newField, setNewField] = useState({ key: '', label: '', type: 'text' as Attribute['data_type'] });
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Identity state
  const jobber = jobbers.find(j => j.id === user?.id);
  const [identity, setIdentity] = useState({ 
    name: jobber?.name || '', 
    handle: jobber?.handle || '', 
    avatar_url: jobber?.avatar_url || '' 
  });

  useEffect(() => {
    if (jobber) setIdentity({ 
      name: jobber.name, 
      handle: jobber.handle, 
      avatar_url: jobber.avatar_url || '' 
    });
  }, [jobber]);

  const handleIdentitySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingIdentity(true);
    await updateJobber(user.id, { 
      name: identity.name, 
      handle: identity.handle,
      avatar_url: identity.avatar_url 
    });
    setIsSavingIdentity(false);
    setSaveToast('Operator Identity Synced');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newField.key || !newField.label) return;
    setIsAdding(true);
    await addField(newField.key, newField.label, newField.type);
    setNewField({ key: '', label: '', type: 'text' });
    setIsAdding(false);
    setSaveToast(`Field '${newField.label}' Added to Schema`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  if (isSchemaLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">System Configuration</h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-wider">Governance & Core Identity Module</p>
        </div>
        {saveToast && (
          <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-500 text-[10px] font-bold uppercase tracking-widest rounded-lg animate-in fade-in slide-in-from-right duration-300">
            <CheckCircle2 className="w-3 h-3" /> {saveToast}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Operator Identity Pane */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-white">
            <User className="w-5 h-5 text-violet-500" />
            <h2 className="font-bold uppercase tracking-wider text-sm">Operator Identity</h2>
          </div>

          <form onSubmit={handleIdentitySave} className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl space-y-4">
             <div className="flex items-center gap-4 mb-4">
                <img 
                  src={identity.avatar_url || 'https://picsum.photos/200'} 
                  className="w-16 h-16 rounded-xl border border-zinc-800 object-cover" 
                  alt="Admin Avatar"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/200'; }}
                />
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider pl-1">Avatar Link</label>
                  <input 
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-2 text-xs text-zinc-400 focus:outline-none focus:border-violet-500/50 transition-all font-mono"
                    value={identity.avatar_url}
                    onChange={e => setIdentity({...identity, avatar_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider pl-1">Display Name</label>
                <input 
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                  value={identity.name}
                  onChange={e => setIdentity({...identity, name: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider pl-1">Handle (@username)</label>
                <input 
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all font-mono"
                  value={identity.handle}
                  onChange={e => setIdentity({...identity, handle: e.target.value})}
                />
             </div>
             <button 
              type="submit" 
              disabled={isSavingIdentity}
              className="w-full py-3 bg-zinc-800 text-zinc-300 font-bold text-[10px] uppercase tracking-widest rounded hover:bg-zinc-700 hover:text-white flex items-center justify-center gap-2 transition-all"
             >
               {isSavingIdentity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Sync Identity
             </button>
          </form>

          <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl space-y-2">
             <div className="flex items-center gap-2 text-violet-400">
               <Megaphone className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Notice</span>
             </div>
             <p className="text-[11px] text-zinc-500 leading-relaxed italic">
               Global Directives have been moved to the <span className="text-violet-500 font-bold">Notification Tab</span> in the Top Bar. 
               Admins can now manage tactical broadcasts directly from the bell icon interface.
             </p>
          </div>
        </div>

        {/* Global Schema Pane */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-white">
            <Layout className="w-5 h-5 text-violet-500" />
            <h2 className="font-bold uppercase tracking-wider text-sm">Member Profile Schema</h2>
          </div>

          <form onSubmit={handleAddField} className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider pl-1">Field Key (id)</label>
                  <input 
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                    placeholder="e.g. telegram_id"
                    value={newField.key}
                    onChange={e => setNewField({...newField, key: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider pl-1">Public Label</label>
                  <input 
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                    placeholder="e.g. Telegram"
                    value={newField.label}
                    onChange={e => setNewField({...newField, label: e.target.value})}
                  />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider pl-1">Input Format</label>
                <select 
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
                  value={newField.type}
                  onChange={e => setNewField({...newField, type: e.target.value as any})}
                >
                  <option value="text">Plain Text</option>
                  <option value="url">External Link (X, LinkedIn, etc)</option>
                  <option value="number">Numeric Value</option>
                  <option value="richtext">Rich Bio / Long Description</option>
                </select>
             </div>
             <button 
              type="submit" 
              disabled={isAdding}
              className="w-full py-2.5 bg-violet-600 text-white font-bold text-[10px] uppercase tracking-widest rounded hover:bg-violet-500 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
             >
               {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
               Deploy Placeholder to Grid
             </button>
          </form>

          <div className="space-y-3">
            {attributes.filter(a => !['atis_score', 'rank', 'stars'].includes(a.key)).map(attr => (
              <div key={attr.key} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition-all">
                <div>
                  <div className="text-sm font-bold text-zinc-100">{attr.label}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">{attr.key} • {attr.data_type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => hideField(attr.key)} className="p-2 text-zinc-500 hover:text-white transition-colors" title="Toggle Visibility">
                    {attr.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-rose-500" />}
                  </button>
                  <button onClick={() => {
                    if(confirm(`Nuking '${attr.label}' will remove it from all member profiles. Proceed?`)) {
                      nukeField(attr.key);
                    }
                  }} className="p-2 text-zinc-500 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
