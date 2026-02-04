
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User as UserIcon, LogOut, UserCircle, Globe, X, Trash2, Megaphone, Layout, MessageSquare, RefreshCw, Plus, Send, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Role } from '../types';

interface TopBarProps {
  onNavigate: (path: string) => void;
  onLogout?: () => void;
  isSandbox?: boolean;
  userOverride?: any;
}

const TopBar: React.FC<TopBarProps> = ({ onNavigate, onLogout, isSandbox, userOverride }) => {
  const { user: authUser, logout: authLogout } = useAuth();
  const { notifications, broadcasts, markAllNotificationsRead, clearNotifications, refreshAllData, addBroadcast, deleteBroadcast } = useData();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAddingDirective, setIsAddingDirective] = useState(false);
  const [directiveMsg, setDirectiveMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const user = userOverride || authUser;
  const isAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN;
  
  const unreadCount = notifications.filter(n => !n.is_read).length + broadcasts.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        if (!isAddingDirective) setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddingDirective]);

  const handleEditProfile = () => {
    onNavigate(user?.role === Role.JOBBER ? 'member-settings' : 'settings');
    setIsMenuOpen(false);
  };

  const handleAppRefresh = async () => {
    setIsMenuOpen(false);
    await refreshAllData();
  };

  const handleDirectiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveMsg.trim() || !isAdmin) return;
    setIsSubmitting(true);
    try {
      await addBroadcast(directiveMsg, 'urgent', user?.id);
      setDirectiveMsg('');
      setIsAddingDirective(false);
    } catch (err) {
      console.error("Directive Transmission Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-[#09090b] sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 shadow-xl">
      <div className={`flex items-center gap-4 flex-1 max-w-xl ${isSearchOpen ? 'fixed inset-0 bg-[#09090b] z-50 px-4' : ''}`}>
        <div className="relative w-full flex items-center gap-2">
          <div className={`relative flex-1 ${!isSearchOpen ? 'hidden md:block' : 'block'}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" placeholder="Search operational database..." className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500/50" />
          </div>
          {isSearchOpen && <button onClick={() => setIsSearchOpen(false)} className="md:hidden p-2 text-zinc-400"><X className="w-5 h-5" /></button>}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {!isSearchOpen && <button onClick={() => setIsSearchOpen(true)} className="md:hidden p-2 text-zinc-400"><Search className="w-5 h-5" /></button>}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-500">
           <Globe className="w-3.5 h-3.5 animate-pulse" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Operational</span>
        </div>

        <div className="relative" ref={notifRef}>
          <button onClick={() => { setIsNotifOpen(!isNotifOpen); if (!isNotifOpen) markAllNotificationsRead(); }} className="relative p-2 text-zinc-400 hover:text-white group">
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full border border-[#09090b]"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
               <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-violet-500" />
                    <h3 className="text-[10px] font-black uppercase text-white tracking-widest">Directive Hub</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button 
                        onClick={() => setIsAddingDirective(!isAddingDirective)} 
                        className={`p-1.5 rounded-lg border transition-all ${isAddingDirective ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-violet-500/10 border-violet-500/20 text-violet-500'}`}
                        title="Broadcast New Directive"
                      >
                        {isAddingDirective ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button onClick={clearNotifications} className="p-1.5 hover:text-rose-500 text-zinc-500" title="Purge Local Cache"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
               </div>

               {isAddingDirective && isAdmin && (
                 <div className="p-4 bg-zinc-950 border-b border-white/5 animate-in fade-in slide-in-from-top-1">
                   <form onSubmit={handleDirectiveSubmit} className="space-y-3">
                     <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Channel: Global Broadcast</p>
                     <textarea 
                        required
                        value={directiveMsg}
                        onChange={e => setDirectiveMsg(e.target.value)}
                        placeholder="Type general update or announcement..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500/50 resize-none h-24 font-light leading-relaxed"
                     />
                     <button 
                      type="submit" 
                      disabled={!directiveMsg.trim() || isSubmitting}
                      className="w-full py-2.5 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-violet-500 flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                     >
                       {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                       Transmit Directive
                     </button>
                   </form>
                 </div>
               )}

               <div className="max-h-96 overflow-y-auto custom-scrollbar bg-zinc-950/50">
                  {broadcasts.length === 0 && notifications.length === 0 ? (
                    <div className="p-16 text-center space-y-4">
                      <ShieldAlert className="w-8 h-8 mx-auto text-zinc-800" />
                      <p className="text-[9px] text-zinc-600 uppercase font-mono tracking-[0.3em]">Operational Log Empty</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                       {broadcasts.map(b => (
                         <div key={b.id} className="p-4 hover:bg-zinc-800 flex gap-4 bg-violet-500/[0.03] group relative">
                            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-violet-500/10 text-violet-500 border border-violet-500/20 shadow-inner">
                               <Megaphone className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                               <div className="flex items-center gap-2 mb-1">
                                 <span className="text-[8px] font-black text-violet-500 uppercase tracking-widest border border-violet-500/20 px-1.5 py-0.5 rounded">DIRECTIVE</span>
                                 <span className="text-[8px] text-zinc-600 font-mono uppercase">{new Date(b.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                               </div>
                               <p className="text-[11px] text-zinc-100 leading-relaxed font-light">{b.message}</p>
                            </div>
                            {isAdmin && (
                              <button 
                                onClick={() => deleteBroadcast(b.id)}
                                className="absolute top-4 right-4 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-rose-500"
                                title="Revoke Directive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                         </div>
                       ))}
                       {notifications.map(n => (
                         <div key={n.id} className={`p-4 hover:bg-zinc-800 flex gap-4 ${!n.is_read ? 'bg-violet-600/5' : ''}`}>
                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${n.type === 'campaign' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : n.type === 'message' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'}`}>
                               {n.type === 'campaign' ? <Layout className="w-4 h-4" /> : n.type === 'message' ? <MessageSquare className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[11px] text-zinc-100 leading-snug mb-1 font-medium">{n.message}</p>
                               <span className="text-[8px] text-zinc-600 uppercase font-mono">{n.type} Node • {new Date(n.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 md:pl-6 md:border-l md:border-zinc-800 relative" ref={menuRef}>
          <div className="text-right hidden lg:block"><div className="text-sm font-medium text-zinc-100">{user?.name}</div><div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">{user?.role}</div></div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 border border-zinc-800 overflow-hidden shadow-inner">
            {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-zinc-500" />}
          </button>
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-1">
               <button onClick={handleEditProfile} className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase text-zinc-400 hover:bg-zinc-900 hover:text-white flex items-center gap-3 transition-colors">
                  <UserCircle className="w-4 h-4 text-violet-500" /> Identity Panel
               </button>
               
               <button onClick={handleAppRefresh} className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase text-zinc-400 hover:bg-zinc-900 hover:text-white flex items-center gap-3 transition-colors">
                  <RefreshCw className="w-4 h-4 text-emerald-500" /> Sync Uplink
               </button>

               <button onClick={async () => { if (onLogout) onLogout(); else await authLogout(); }} className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase text-rose-500 hover:bg-rose-500/5 flex items-center gap-3 transition-colors">
                  <LogOut className="w-4 h-4" /> Sever Link
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
