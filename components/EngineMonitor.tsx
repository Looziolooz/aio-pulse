
import React, { useState, useEffect } from 'react';
import { 
  Activity, Zap, Globe, Cpu, AlertCircle, CheckCircle2, 
  Clock, RefreshCw, BarChart3, Radio, Loader2
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { getMonitorData } from '../services/geminiService';
import { MonitorData } from '../types';

const EngineMonitor: React.FC = () => {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getMonitorData();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engine Monitor</h1>
          <p className="text-gray-400">Real-time surveillance of AI search indexing and response patterns.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <Radio className={`w-3 h-3 ${loading ? 'text-gray-400' : 'text-emerald-400 animate-pulse'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            {loading ? 'Connecting...' : 'Live Network Status'}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="h-48 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse"></div>
          ))
        ) : (
          data?.engines.map((engine) => (
            <div key={engine.id} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-gray-700 transition-all">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-2.5 bg-black rounded-xl border border-gray-800 group-hover:border-gray-700 transition-colors">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                </div>
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${engine.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {engine.status}
                </div>
              </div>

              <h3 className="font-bold text-lg mb-1">{engine.name}</h3>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {engine.latency}</span>
                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {engine.freshness} Fresh</span>
              </div>

              <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engine.performanceData}>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={engine.color} 
                      fill={engine.color} 
                      fillOpacity={0.1} 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" /> Discovery Log</h3>
              <button onClick={fetchData} className="text-xs text-indigo-400 hover:underline">Refresh Logs</button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-16 bg-black/40 border border-gray-800 rounded-xl animate-pulse"></div>)}
                </div>
              ) : (
                data?.logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 bg-black/40 border border-gray-800/50 rounded-xl hover:bg-black/60 transition-colors">
                    <div className="w-12 text-[10px] font-medium text-gray-500">{log.time}</div>
                    <div className="shrink-0 px-2 py-0.5 rounded bg-gray-800 text-[10px] font-bold text-gray-300 w-24 text-center">{log.engine}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{log.event}</p>
                      <p className="text-xs text-gray-500">{log.detail}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl shadow-indigo-500/10 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-white" />
              <h3 className="font-bold text-white">System Health</h3>
            </div>
            <p className="text-indigo-100 text-sm mb-6">All global crawlers are currently optimized for high-throughput discovery.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-3 border border-white/5">
                <span className="block text-[10px] text-indigo-200 uppercase font-black">CPU Usage</span>
                <span className="text-xl font-bold text-white">{loading ? '...' : `${data?.cpuUsage}%`}</span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/5">
                <span className="block text-[10px] text-indigo-200 uppercase font-black">Success Rate</span>
                <span className="text-xl font-bold text-white">{loading ? '...' : `${data?.successRate}%`}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4 text-amber-400" /> Maintenance Alerts</h3>
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
              <p className="text-xs text-amber-200/80 leading-relaxed">
                {loading ? 'Checking for alerts...' : (data?.maintenanceAlert || 'System is operating within normal parameters.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineMonitor;
