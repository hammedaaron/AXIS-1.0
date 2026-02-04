
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../constants';
import { Role } from '../types';
import { Menu, X, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (path: string) => void;
  userRoleOverride?: Role;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, userRoleOverride }) => {
  const { user: authUser, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const role = userRoleOverride || authUser?.role;
  const isAdmin = role === Role.SUPER_ADMIN || role === Role.ADMIN;
  const filteredNav = NAV_ITEMS.filter(item => role && item.roles.includes(role));

  return (
    <aside 
      className={`
        hidden md:flex sticky top-0 h-screen border-r border-zinc-800 bg-[#09090b] transition-all duration-300 z-50 flex-col
        ${isExpanded ? 'w-64' : 'w-20'} 
        ${isAdmin ? 'shadow-[10px_0_30px_rgba(139,92,246,0.03)]' : ''}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="h-16 flex items-center px-6 mb-8 mt-2 overflow-hidden">
        <div className={`w-8 h-8 ${isAdmin ? 'bg-violet-600' : 'bg-zinc-800'} rounded flex items-center justify-center font-bold text-white text-xl shrink-0 transition-all shadow-lg`}>A</div>
        {isExpanded && <span className="ml-3 font-bold text-xl tracking-tighter text-white animate-in fade-in slide-in-from-left-2">AXIS</span>}
      </div>

      <nav className="flex-1 flex flex-col gap-1.5 px-3">
        {filteredNav.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`flex items-center h-11 rounded-xl transition-all group relative ${
              currentView === item.path 
                ? isAdmin ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-white text-black'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
            } ${isExpanded ? 'px-4' : 'justify-center'}`}
          >
            <span className={`shrink-0 transition-transform ${currentView === item.path ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            {isExpanded && (
              <span className="ml-4 font-semibold text-xs uppercase tracking-widest whitespace-nowrap overflow-hidden">
                {item.label}
              </span>
            )}
            {!isExpanded && currentView === item.path && (
               <div className="absolute -left-3 w-1.5 h-6 bg-violet-500 rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        {isExpanded ? (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-3">
             <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.2em]">Security Tier</div>
             <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-violet-500' : 'bg-blue-500'} animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.5)]`}></div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'text-violet-400' : 'text-blue-400'}`}>
                  {isAdmin ? 'Privileged' : 'Operator'}
                </span>
             </div>
          </div>
        ) : (
          <button onClick={() => logout()} className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-600 hover:text-rose-500 hover:bg-rose-500/5 transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
