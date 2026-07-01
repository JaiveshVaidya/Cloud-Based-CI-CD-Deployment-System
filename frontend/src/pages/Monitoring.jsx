import React, { useEffect, useState, useRef } from 'react';
import monitoringService from '../services/monitoringService';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Server, 
  Loader2, 
  RefreshCw,
  TrendingUp,
  Network
} from 'lucide-react';

const Monitoring = () => {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchLiveMetrics = async () => {
    try {
      const data = await monitoringService.getLiveMetrics();
      setMetrics(data);
      
      // Update historical array for line chart (limit to last 15 readings)
      setHistory(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = { 
          time: timeStr, 
          cpu: data.cpuUsage, 
          memory: data.memoryUsage,
          rx: data.networkRx,
          tx: data.networkTx
        };
        const updated = [...prev, newPoint];
        if (updated.length > 15) {
          return updated.slice(updated.length - 15);
        }
        return updated;
      });
    } catch (err) {
      console.error('Error fetching live system metrics:', err);
    }
  };

  const fetchPodsList = async () => {
    try {
      const podData = await monitoringService.getKubernetesPods();
      setPods(podData);
    } catch (err) {
      console.error('Error fetching kubernetes pods:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLiveMetrics(), fetchPodsList()]);
      setLoading(false);
      
      // Setup live metric poll every 1.5s
      timerRef.current = setInterval(fetchLiveMetrics, 1500);
    };

    init();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const getPodStatusDot = (status) => {
    if (status === 'Running') {
      return (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      );
    }
    return <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span>;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[70vh]">
        <Loader2 className="text-cyan-500 animate-spin mr-2" size={32} />
        <span className="text-slate-400 font-medium">Opening cluster dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Cluster Metrics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time monitoring of CPU, memory, and container pod orchestrations.
          </p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>LIVE STREAM ACTIVE</span>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CPU Chart */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu size={16} className="text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-300">CPU Usage</h3>
            </div>
            <span className="font-mono text-sm font-bold text-cyan-400">
              {metrics?.cpuUsage}%
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1424', borderColor: '#1e294b', color: '#f1f5f9', borderRadius: '8px' }}
                  labelClassName="font-mono text-xs text-slate-500"
                />
                <Area type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Chart */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp size={16} className="text-purple-400" />
              <h3 className="font-bold text-sm text-slate-300">Memory Utilization</h3>
            </div>
            <span className="font-mono text-sm font-bold text-purple-400">
              {metrics?.memoryUsage}%
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1424', borderColor: '#1e294b', color: '#f1f5f9', borderRadius: '8px' }}
                  labelClassName="font-mono text-xs text-slate-500"
                />
                <Area type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Ingress/Egress Chart */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network size={16} className="text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-300">Network Bandwidth (Rx/Tx)</h3>
            </div>
            <div className="flex space-x-4 font-mono text-xs">
              <span className="text-emerald-400">Rx: {metrics?.networkRx} MB/s</span>
              <span className="text-amber-400">Tx: {metrics?.networkTx} MB/s</span>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1424', borderColor: '#1e294b', color: '#f1f5f9', borderRadius: '8px' }}
                  labelClassName="font-mono text-xs text-slate-500"
                />
                <Area type="monotone" dataKey="rx" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRx)" name="Inbound (Rx)" />
                <Area type="monotone" dataKey="tx" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTx)" name="Outbound (Tx)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Kubernetes Pods Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center space-x-2">
          <Server size={20} className="text-cyan-400" />
          <span>Active Kubernetes Pods</span>
        </h2>
        
        <div className="glass-panel rounded-2xl overflow-hidden border border-dark-border/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-[#0a0d16] border-b border-dark-border/40 text-[10px] font-bold text-slate-400 tracking-wider">
                  <th className="p-4">POD NAME</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">RESTARTS</th>
                  <th className="p-4">CPU ALLOCATION</th>
                  <th className="p-4">MEMORY FOOTPRINT</th>
                  <th className="p-4">AGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-slate-300">
                {pods.map((pod, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 font-semibold text-slate-200">
                      {pod.name}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {getPodStatusDot(pod.status)}
                        <span>{pod.status}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {pod.restarts}
                    </td>
                    <td className="p-4 text-cyan-400">
                      {pod.cpu}
                    </td>
                    <td className="p-4 text-purple-400">
                      {pod.memory}
                    </td>
                    <td className="p-4 text-slate-500">
                      {pod.age}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
export { Monitoring };
