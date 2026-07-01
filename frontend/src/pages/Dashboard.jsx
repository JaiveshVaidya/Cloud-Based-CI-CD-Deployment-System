import React, { useEffect, useState } from 'react';
import buildService from '../services/buildService';
import projectService from '../services/projectService';
import { 
  Folder, 
  CheckCircle, 
  XCircle, 
  Play, 
  Cpu, 
  GitBranch, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Plus,
  RefreshCw,
  Loader2,
  Trash2
} from 'lucide-react';

const Dashboard = ({ navigate }) => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringMap, setTriggeringMap] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, projectsData] = await Promise.all([
        buildService.getBuildStats(),
        projectService.getProjects()
      ]);
      setStats(statsData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerBuild = async (e, projectId) => {
    e.stopPropagation(); // prevent card click navigation
    setTriggeringMap(prev => ({ ...prev, [projectId]: true }));
    try {
      const newBuild = await buildService.triggerBuild(projectId);
      // Navigate to the newly triggered build run live logs
      navigate(`#build/${newBuild.id}`);
    } catch (err) {
      console.error('Failed to trigger build:', err);
      alert('Failed to trigger build pipeline.');
      setTriggeringMap(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project? All build history will be removed.")) return;
    try {
      await projectService.deleteProject(projectId);
      fetchData(); // refresh
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
            <CheckCircle size={12} />
            <span>Success</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center space-x-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
            <XCircle size={12} />
            <span>Failed</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center space-x-1 text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>Running</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[70vh]">
        <Loader2 className="text-cyan-500 animate-spin mr-2" size={32} />
        <span className="text-slate-400 font-medium">Loading platform workspace...</span>
      </div>
    );
  }

  // Calculate Success Rate Percentage
  const total = stats?.totalBuilds || 0;
  const success = stats?.successBuilds || 0;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 100;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Build Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Overview of active pipelines, repositories, and build statistics.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchData}
            className="flex items-center justify-center p-2.5 bg-dark-card hover:bg-dark-border/40 border border-dark-border/60 rounded-xl text-slate-400 hover:text-white transition-all duration-200"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => navigate('#new-project')}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-glow-cyan/20 active:scale-[0.98] transition-all duration-200"
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wider">TOTAL PROJECTS</span>
            <h3 className="text-3xl font-bold">{projects.length}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <Folder size={24} />
          </div>
        </div>

        {/* Success Rate */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wider">SUCCESS RATE</span>
            <h3 className="text-3xl font-bold">{successRate}%</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Active Runs */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wider">ACTIVE RUNNERS</span>
            <h3 className="text-3xl font-bold">{stats?.activeBuilds || 0}</h3>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
            <Loader2 size={24} className={stats?.activeBuilds > 0 ? "animate-spin" : ""} />
          </div>
        </div>

        {/* Total Builds */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wider">TOTAL BUILDS</span>
            <h3 className="text-3xl font-bold">{stats?.totalBuilds || 0}</h3>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
            <Cpu size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects List Card */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Active Projects</h2>
          
          {projects.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center space-y-4">
              <p className="text-slate-400 text-sm">No deployment projects registered yet.</p>
              <button
                onClick={() => navigate('#new-project')}
                className="inline-flex items-center space-x-2 bg-[#1e294b]/60 border border-dark-border/80 text-cyan-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-dark-border/40 transition-colors"
              >
                <Plus size={14} />
                <span>Add your first project</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`#project/${project.id}`)}
                  className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-lg text-slate-100 flex items-center space-x-2">
                      <span>{project.name}</span>
                      <ChevronRight size={16} className="text-slate-500" />
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-md">{project.description || 'No description provided.'}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2 font-mono">
                      <span className="flex items-center space-x-1.5 bg-[#0a0d16] px-2 py-0.5 rounded border border-dark-border/30">
                        <GitBranch size={12} />
                        <span>{project.branch}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ExternalLink size={12} />
                        <span className="truncate max-w-xs">{project.gitRepoUrl}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end md:self-auto">
                    <button
                      onClick={(e) => handleTriggerBuild(e, project.id)}
                      disabled={triggeringMap[project.id]}
                      className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all duration-200 disabled:opacity-50"
                    >
                      {triggeringMap[project.id] ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Play size={12} fill="white" />
                      )}
                      <span>Run Pipeline</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 bg-[#0a0d16] hover:bg-rose-500/10 border border-dark-border/30 hover:border-rose-500/30 rounded-xl transition-all duration-200"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Activity Feed Card */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Recent Pipelines</h2>
          <div className="glass-panel p-5 rounded-2xl divide-y divide-dark-border/40 space-y-4">
            {(!stats?.latestRuns || stats.latestRuns.length === 0) ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">No build records found.</p>
            ) : (
              stats.latestRuns.map((run, index) => (
                <div 
                  key={run.id}
                  onClick={() => navigate(`#build/${run.id}`)}
                  className={`pt-4 first:pt-0 flex items-center justify-between cursor-pointer group`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-300 group-hover:text-cyan-400 transition-colors">
                        {run.project.name} #{run.buildNumber}
                      </span>
                      {getStatusBadge(run.status)}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      commit: {run.commitHash}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-[200px] truncate">
                      "{run.commitMessage}"
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1.5 text-right font-mono">
                    <span className="text-[10px] text-slate-500">
                      {run.triggerType}
                    </span>
                    {run.duration && (
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <Clock size={10} />
                        <span>{run.duration}s</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
