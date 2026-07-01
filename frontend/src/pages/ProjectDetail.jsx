import React, { useEffect, useState } from 'react';
import projectService from '../services/projectService';
import buildService from '../services/buildService';
import { 
  ArrowLeft, 
  Play, 
  GitBranch, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Settings,
  Calendar,
  Layers,
  Container
} from 'lucide-react';

const ProjectDetail = ({ projectId, navigate }) => {
  const [project, setProject] = useState(null);
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projData, buildsData] = await Promise.all([
        projectService.getProjectById(projectId),
        buildService.getBuildsForProject(projectId)
      ]);
      setProject(projData);
      setBuilds(buildsData);
    } catch (err) {
      console.error('Error fetching project data:', err);
      navigate('#dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleTriggerBuild = async () => {
    setTriggering(true);
    try {
      const newBuild = await buildService.triggerBuild(projectId);
      navigate(`#build/${newBuild.id}`);
    } catch (err) {
      console.error('Failed to trigger build:', err);
      alert('Failed to trigger build pipeline.');
    } finally {
      setTriggering(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[11px] font-medium">
            <CheckCircle size={10} />
            <span>Success</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center space-x-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full text-[11px] font-medium">
            <XCircle size={10} />
            <span>Failed</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center space-x-1 text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full text-[11px] font-medium animate-pulse">
            <Loader2 size={10} className="animate-spin" />
            <span>Running</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[11px] font-medium">
            <Clock size={10} />
            <span>Pending</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[70vh]">
        <Loader2 className="text-cyan-500 animate-spin mr-2" size={32} />
        <span className="text-slate-400 font-medium">Loading project details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back and Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('#dashboard')}
            className="p-2 bg-dark-card hover:bg-dark-border/40 border border-dark-border/60 rounded-xl text-slate-400 hover:text-white transition-all duration-200"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-slate-400 text-xs mt-0.5">{project.description || 'No description provided.'}</p>
          </div>
        </div>

        <button
          onClick={handleTriggerBuild}
          disabled={triggering}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-md active:scale-95 transition-all duration-200 disabled:opacity-50 self-start md:self-auto"
        >
          {triggering ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} fill="white" />
          )}
          <span>Trigger Manual Build</span>
        </button>
      </div>

      {/* Metadata Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Git Integration Details */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 tracking-wider flex items-center space-x-2">
            <GitBranch size={14} className="text-cyan-400" />
            <span>GIT CONNECTION</span>
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-slate-500 block">Repository Clone URL</span>
              <a 
                href={project.gitRepoUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-sm font-semibold text-slate-200 hover:text-cyan-400 transition-colors flex items-center space-x-1 font-mono break-all mt-0.5"
              >
                <span className="truncate max-w-[200px]">{project.gitRepoUrl}</span>
                <ExternalLink size={12} className="shrink-0" />
              </a>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Target Branch</span>
              <span className="text-sm font-semibold text-slate-200 font-mono">{project.branch}</span>
            </div>
          </div>
        </div>

        {/* Docker details */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 tracking-wider flex items-center space-x-2">
            <Container size={14} className="text-purple-400" />
            <span>CONTAINER REGISTRY</span>
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-slate-500 block">Image Destination Name</span>
              <span className="text-sm font-semibold text-slate-200 font-mono">{project.dockerImageName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">AWS ECR / Registry Server</span>
              <span className="text-sm font-semibold text-slate-200 font-mono break-all">{project.dockerRegistry}</span>
            </div>
          </div>
        </div>

        {/* Kubernetes details */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 tracking-wider flex items-center space-x-2">
            <Layers size={14} className="text-emerald-400" />
            <span>KUBERNETES DEPLOY</span>
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-slate-500 block">Target Cluster Namespace</span>
              <span className="text-sm font-semibold text-slate-200 font-mono">{project.k8sNamespace}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Created On</span>
              <span className="text-sm font-semibold text-slate-200 font-mono flex items-center space-x-1.5 mt-0.5">
                <Calendar size={12} />
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Build History Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Execution History</h2>
        
        {builds.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center">
            <p className="text-slate-400 text-sm">No builds recorded. Trigger a build above to get started.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden border border-dark-border/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0a0d16] border-b border-dark-border/40 text-xs font-semibold text-slate-400 tracking-wider">
                    <th className="p-4 w-24">Build</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Trigger</th>
                    <th className="p-4">VCS Commit Info</th>
                    <th className="p-4 w-32">Duration</th>
                    <th className="p-4 w-44">Start Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-sm">
                  {builds.map((run) => (
                    <tr 
                      key={run.id}
                      onClick={() => navigate(`#build/${run.id}`)}
                      className="hover:bg-slate-900/30 cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-300">
                        #{run.buildNumber}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(run.status)}
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-400">
                        {run.triggerType}
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5 max-w-sm">
                          <p className="text-xs text-slate-500 font-mono truncate">commit: {run.commitHash}</p>
                          <p className="text-xs text-slate-300 truncate font-sans">"{run.commitMessage}"</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">
                        {run.duration ? `${run.duration}s` : '--'}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(run.startTime).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
