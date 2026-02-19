
import React, { useState } from 'react';
import { LayoutGrid, FileSearch, LineChart, Shield, Menu, X, Bell, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ContentOptimizer from './components/ContentOptimizer';
import EngineMonitor from './components/EngineMonitor';
import Analytics from './components/Analytics';
import { ViewType } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const NavItem = ({ id, label, icon: Icon }: { id: ViewType; label: string; icon: any }) => (
    <button
      onClick={() => {
        setCurrentView(id);
        setSidebarOpen(false);
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        currentView === id 
        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0c14] border-r border-gray-800 transition-transform lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">AIO Pulse</span>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem id="dashboard" label="Dashboard" icon={LayoutGrid} />
            <NavItem id="optimizer" label="Content Optimizer" icon={FileSearch} />
            <NavItem id="monitor" label="Engine Monitor" icon={Shield} />
            <NavItem id="analytics" label="Analytics" icon={LineChart} />
          </nav>

          <div className="mt-auto p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Jane Doe</p>
                <p className="text-xs text-gray-500 truncate">Pro Account</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-[#030712]/50 backdrop-blur-md sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-400">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 max-w-md ml-4 hidden md:block">
            <div className="relative">
              <X className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-gray-800 mx-1"></div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 md:p-10">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'optimizer' && <ContentOptimizer />}
          {currentView === 'monitor' && <EngineMonitor />}
          {currentView === 'analytics' && <Analytics />}
        </section>
      </main>
    </div>
  );
};

export default App;
