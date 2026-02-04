
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchemaProvider } from './context/SchemaContext';
import { DataProvider, useData } from './context/DataContext';
import { Role, Jobber, Rank } from './types';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import AuthScreen from './components/AuthScreen';
import ProfileDrawer from './components/ProfileDrawer';
import Dashboard from './views/Dashboard';
import Jobbers from './views/Jobbers';
import Settings from './views/Settings';
import Messages from './views/Messages';
import Campaigns from './views/Campaigns';
import ProofQueue from './views/ProofQueue';
import MemberSettings from './views/MemberSettings';
import { NAV_ITEMS } from './constants';

const MobileNav: React.FC<{ currentView: string; onNavigate: (p: string) => void; role?: Role }> = ({ currentView, onNavigate, role }) => {
  const filteredNav = NAV_ITEMS.filter(item => role && item.roles.includes(role));
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09090b] border-t border-zinc-800 z-[60] flex items-center justify-around px-2 pb-safe">
      {filteredNav.map(item => (
        <button 
          key={item.path} 
          onClick={() => onNavigate(item.path)}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${currentView === item.path ? 'text-violet-500 bg-violet-500/10' : 'text-zinc-600'}`}
        >
          {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
          <span className="text-[8px] font-bold uppercase tracking-tighter mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { user, logout: authLogout } = useAuth();
  const [currentView, setCurrentView] = useState('overview');
  const [selectedJobber, setSelectedJobber] = useState<Jobber | null>(null);

  useEffect(() => {
    if (user?.role === Role.JOBBER) setCurrentView('dashboard');
    else setCurrentView('overview');
  }, [user]);

  const handleLogout = async () => {
    await authLogout();
  };

  const renderView = () => {
    try {
      switch (currentView) {
        case 'overview':
        case 'dashboard': return <Dashboard />;
        case 'jobbers': return <Jobbers onSelect={setSelectedJobber} />;
        case 'proof-queue': return <ProofQueue />;
        case 'campaigns': return <Campaigns />;
        case 'settings': return <Settings />;
        case 'member-settings': return <MemberSettings />;
        case 'messages': return <Messages onSelectJobber={setSelectedJobber} userOverride={user} />;
        default: return <Dashboard />;
      }
    } catch (err) {
      console.error("[AXIS] View Component Failed:", err);
      return <div className="p-10 text-center text-rose-500 font-mono text-xs uppercase tracking-widest">View initialization fault. Sync required.</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-300">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} userRoleOverride={user?.role} />
      <div className="flex-1 flex flex-col relative overflow-hidden pb-16 md:pb-0">
        <TopBar onNavigate={setCurrentView} onLogout={handleLogout} isSandbox={false} userOverride={user} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-grid-zinc-900/[0.02]">
          {renderView()}
        </main>
        <MobileNav currentView={currentView} onNavigate={setCurrentView} role={user?.role} />
      </div>
      <ProfileDrawer jobber={selectedJobber} onClose={() => setSelectedJobber(null)} />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isLoading: authLoading, user } = useAuth();
  const { isLoading: dataLoading } = useData();
  const [isSplashing, setIsSplashing] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setIsSplashing(false);
    }, 1500);
    return () => clearTimeout(splashTimer);
  }, []);

  if (isSplashing) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center grid-bg">
        <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center font-bold text-white text-4xl shadow-[0_0_50px_rgba(139,92,246,0.5)] animate-bounce">A</div>
        <div className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.6em] mt-12 animate-pulse">Initializing Neural Link</div>
      </div>
    );
  }

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <div className="w-12 h-1 bg-zinc-900 rounded-full overflow-hidden">
           <div className="h-full bg-violet-600 animate-[loading_1.5s_infinite]" />
        </div>
        <span className="text-[9px] text-zinc-700 font-mono uppercase mt-6 tracking-widest">Authenticating Signal Payload</span>
      </div>
    );
  }

  if (!user) return <AuthScreen onLaunchSandbox={() => {}} />;
  return <MainLayout />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SchemaProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </SchemaProvider>
    </AuthProvider>
  );
};

export default App;
