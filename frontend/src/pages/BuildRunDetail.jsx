import React, { useEffect, useState, useRef } from 'react';
import buildService from '../services/buildService';
import Terminal from '../components/Terminal';
import { 
  ArrowLeft, 
  GitBranch, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play,
  Check,
  AlertTriangle,
  PlayCircle
} from 'lucide-react';

const BuildRunDetail = ({ buildId, navigate }) => {
  const [build, setBuild] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const fetchBuildStatus = async () => {
    try {
      const buildData = await buildService.getBuildById(buildId);
      setBuild(buildData);
      
      // If build has finished, stop polling
      if (buildData.status === 'SUCCESS' || buildData.status === 'FAILED') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error fetching build status:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const buildData = await buildService.getBuildById(buildId);
        setBuild(buildData);

        // Connect WebSocket for log stream
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//localhost:8080/ws/logs?buildId=${buildId}`;
        
        setLogs([]); // Clear logs first
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          setLogs(prev => [...prev, event.data]);
        };

        ws.onerror = (err) => {
          console.error('WebSocket log stream error:', err);
        };

        ws.onclose = () => {
          console.log('WebSocket log stream closed.');
        };

        // If the build is still running or pending, start polling database updates
        if (buildData.status === 'PENDING' || buildData.status === 'RUNNING') {
          pollIntervalRef.current = setInterval(fetchBuildStatus, 2000);
        }
      } catch (err) {
        console.error('Error loading build page:', err);
        navigate('#dashboard');
      } finally {
        setLoading(false);
      }
    };

    init();

    // Clean up connections on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [buildId]);

  const getStepIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center">
            <Check size={12} strokeWidth={3} />
          </div>
        );
      case 'FAILED':
        return (
          <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 flex items-center justify-center">
            <AlertTriangle size={12} strokeWidth={3} />
          </div>
        );
      case 'RUNNING':
        return (
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 flex items-center justify-center animate-spin">
            <Loader2 size={12} />
          </div>
        );
      case 'SKIPPED':
        return (
          <div className="w-6 h-6 rounded-full bg-slate-800/40 border border-slate-700 text-slate-500 flex items-center justify-center text-[10px] font-bold">
            SKIP
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-[#0a0d16] border border-dark-border/80 text-slate-500 flex items-center justify-center text-xs">
            •
          </div>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full text-xs font-semibold">
            <CheckCircle size={12} />
            <span>Success</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center space-x-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-0.5 rounded-full text-xs font-semibold">
            <XCircle size={12} />
            <span>Failed</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center space-x-1 text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-0.5 rounded-full text-xs font-semibold animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>Running Pipeline</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-full text-xs font-semibold">
            <Clock size={12} />
            <span>Pending Allocation</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[70vh]">
        <Loader2 className="text-cyan-500 animate-spin mr-2" size={32} />
        <span className="text-slate-400 font-medium">Connecting to pipeline log stream...</span>
      </div>
    );
  }

  const isPipelineActive = build.status === 'PENDING' || build.status === 'RUNNING';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`#project/${build.project.id}`)}
            className="p-2 bg-dark-card hover:bg-dark-border/40 border border-dark-border/60 rounded-xl text-slate-400 hover:text-white transition-all duration-200"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Build Run #{build.buildNumber}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 flex items-center space-x-2">
              <span className="font-bold text-slate-300">{build.project.name}</span>
              <span>•</span>
              <span className="font-mono text-cyan-400">{build.project.branch}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {getStatusBadge(build.status)}
          {build.duration && (
            <span className="font-mono text-xs text-slate-400 flex items-center space-x-1">
              <Clock size={12} />
              <span>{build.duration}s total duration</span>
            </span>
          )}
        </div>
      </div>

      {/* Commit Meta Strip */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div>
          <span className="text-slate-500 block text-[10px]">COMMIT HASH</span>
          <span className="text-slate-200 font-semibold">{build.commitHash}</span>
        </div>
        <div className="flex-1 md:px-6">
          <span className="text-slate-500 block text-[10px]">COMMIT MESSAGE</span>
          <span className="text-slate-200 truncate inline-block max-w-lg">"{build.commitMessage}"</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">TRIGGERED BY</span>
          <span className="text-slate-200 font-semibold">{build.commitAuthor} ({build.triggerType})</span>
        </div>
      </div>

      {/* Main execution workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Pipeline Timeline Steps */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold tracking-wider text-slate-400">PIPELINE JOBS</h2>
          
          <div className="glass-panel p-5 rounded-2xl relative space-y-6">
            
            {build.steps.map((step, idx) => (
              <div key={step.id} className="relative flex items-start space-x-3.5 group">
                
                {/* Vertical timeline connector lines */}
                {idx < build.steps.length - 1 && (
                  <span className="absolute left-[11px] top-6 w-px h-10 bg-dark-border/40 group-hover:bg-dark-border/80 transition-colors" />
                )}
                
                {/* Status dot */}
                <div className="relative z-10">
                  {getStepIcon(step.status)}
                </div>
                
                {/* Step Metadata */}
                <div className="space-y-0.5 select-none">
                  <h4 className="text-xs font-bold font-mono tracking-wide text-slate-200">
                    {step.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                    <span className="capitalize">{step.status.toLowerCase()}</span>
                    {step.duration && (
                      <>
                        <span>•</span>
                        <span>{step.duration}s</span>
                      </>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Live log Terminal */}
        <div className="lg:col-span-3 h-full">
          <h2 className="text-sm font-bold tracking-wider text-slate-400 mb-4">CONSOLE LOGS</h2>
          <div className="h-[520px]">
            <Terminal logs={logs} isRunning={isPipelineActive} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default BuildRunDetail;
