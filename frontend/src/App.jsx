import React, { useState, useEffect } from 'react';
import authService from './services/authService';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import ProjectDetail from './pages/ProjectDetail';
import BuildRunDetail from './pages/BuildRunDetail';
import Monitoring from './pages/Monitoring';

// Icons
import { 
  Terminal, 
  LayoutDashboard, 
  Activity, 
  PlusCircle, 
  LogOut, 
  User, 
  Menu, 
  X,
  Cpu
} from 'lucide-react';

function App() {
  const [route, setRoute] = useState(window.location.hash || '#dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hash-routing listener
  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash || '#dashboard';
      setRoute(currentHash);
      
      // Auto-close sidebar on mobile navigation
      setSidebarOpen(false);

      // Verify authentication for secured routes
      const isAuthRoute = currentHash === '#login' || currentHash === '#register';
      if (!authService.isAuthenticated() && !isAuthRoute) {
        window.location.hash = '#login';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial load check
    const isAuthRoute = route === '#login' || route === '#register';
    if (!authService.isAuthenticated() && !isAuthRoute) {
      window.location.hash = '#login';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setCurrentUser(authService.getCurrentUser());
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    window.location.hash = '#login';
  };

  const navigate = (hash) => {
    window.location.hash = hash;
  };

  // Route Parser & Page Loader
  const renderContent = () => {
    // Unsecured auth pages
    if (route === '#login') {
      return <Login onAuthSuccess={handleAuthSuccess} navigate={navigate} />;
    }
    if (route === '#register') {
      return <Register navigate={navigate} />;
    }

    // Secured dashboard pages
    if (!isAuthenticated) {
      return <Login onAuthSuccess={handleAuthSuccess} navigate={navigate} />;
    }

    if (route === '#dashboard' || route === '') {
      return <Dashboard navigate={navigate} />;
    }
    if (route === '#new-project') {
      return <CreateProject navigate={navigate} />;
    }
    if (route === '#monitoring') {
      return <Monitoring />;
    }
    if (route.startsWith('#project/')) {
      const projectId = route.split('/')[1];
      return <ProjectDetail projectId={projectId} navigate={navigate} />;
    }
    if (route.startsWith('#build/')) {
      const buildId = route.split('/')[1];
      return <BuildRunDetail buildId={buildId} navigate={navigate} />;
    }

    // Fallback
    return <Dashboard navigate={navigate} />;
  };

  const isAuthPage = route === '#login' || route === '#register';

  // Render auth flows directly without sidebar
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text select-none">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex">
      
      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0d16] border-b border-dark-border/40 px-4 flex items-center justify-between z-40 select-none">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 rounded-lg border border-purple-500/30">
            <Terminal className="text-cyan-400" size={18} />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-wide">
            ANTIGRAVITY
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 w-64 bg-[#0a0d16] border-r border-dark-border/40 flex flex-col justify-between z-50 transform lg:transform-none transition-transform duration-300 select-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header Section */}
        <div>
          <div className="h-20 border-b border-dark-border/40 px-6 flex items-center space-x-3 bg-gradient-to-b from-dark-card/20 to-transparent">
            <div className="p-2 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 rounded-xl border border-purple-500/30">
              <Terminal className="text-cyan-400" size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tracking-wider text-sm">
                ANTIGRAVITY
              </span>
              <span className="text-[9px] text-cyan-400/90 font-mono tracking-widest mt-0.5">
                MICRO ENGINE
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => navigate('#dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 focus:outline-none
                ${(route === '#dashboard' || route === '') 
                  ? 'bg-gradient-to-r from-purple-500/25 to-cyan-500/25 text-white border border-purple-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-border/30 border border-transparent'}
              `}
            >
              <LayoutDashboard size={16} />
              <span>DASHBOARD</span>
            </button>

            <button
              onClick={() => navigate('#new-project')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 focus:outline-none
                ${route === '#new-project' 
                  ? 'bg-gradient-to-r from-purple-500/25 to-cyan-500/25 text-white border border-purple-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-border/30 border border-transparent'}
              `}
            >
              <PlusCircle size={16} />
              <span>NEW PROJECT</span>
            </button>

            <button
              onClick={() => navigate('#monitoring')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 focus:outline-none
                ${route === '#monitoring' 
                  ? 'bg-gradient-to-r from-purple-500/25 to-cyan-500/25 text-white border border-purple-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-border/30 border border-transparent'}
              `}
            >
              <Activity size={16} />
              <span>CLUSTER MONITOR</span>
            </button>
          </nav>
        </div>

        {/* Footer Section */}
        <div className="p-4 space-y-4 border-t border-dark-border/40 bg-gradient-to-t from-dark-card/25 to-transparent">
          {currentUser && (
            <div className="flex items-center space-x-3 bg-dark-card/40 border border-dark-border/40 p-3 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                {currentUser.username.substring(0, 1).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-slate-200 truncate">{currentUser.username}</span>
                <span className="text-[10px] text-slate-500 truncate">{currentUser.email}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 focus:outline-none"
          >
            <LogOut size={16} />
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden pt-16 lg:pt-0">
        
        {/* Decorative Grid Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <div className="flex-1 p-6 md:p-10 relative z-10 max-w-7xl w-full mx-auto">
          {renderContent()}
        </div>
      </main>

    </div>
  );
}

export default App;
