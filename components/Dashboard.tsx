
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Activity, Globe, Zap, ShieldCheck, Loader2, RefreshCcw } from 'lucide-react';
import { getDashboardData } from '../services/geminiService';
import { DashboardData } from '../types';

const StatCard = ({ title, value, change, icon: Icon, color, loading }: any) => (
  <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg bg-${color}-500/10`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      {!loading && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
    <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
    {loading ? (
      <div className="h-8 w-24 bg-gray-800 animate-pulse rounded mt-1"></div>
    ) : (
      <p className="text-2xl font-bold mt-1">{value}</p>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getDashboardData();
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-gray-400">Monitoring your digital footprint across generative AI.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} disabled={loading} className="px-4 py-2 bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Sync Data
          </button>
          <button className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">New Scan</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="AI Visibility" value={data?.visibility || '0%'} change={data?.visibilityChange || 0} icon={Globe} color="indigo" loading={loading} />
        <StatCard title="Direct Citations" value={data?.citations || '0'} change={data?.citationsChange || 0} icon={Zap} color="emerald" loading={loading} />
        <StatCard title="AEO Authority" value={`${data?.authority || 0}/100`} change={data?.authorityChange || 0} icon={ShieldCheck} color="blue" loading={loading} />
        <StatCard title="Avg. Rank Position" value={data?.rank || '#0.0'} change={data?.rankChange || 0} icon={Activity} color="purple" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6">Visibility Growth</h3>
          <div className="h-[300px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-xl">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.growthChart}>
                  <defs>
                    <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#f9fafb' }}
                  />
                  <Area type="monotone" dataKey="visibility" stroke="#6366f1" fillOpacity={1} fill="url(#colorVis)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6">Engine Performance</h3>
          <div className="space-y-6">
            {loading ? (
               [1,2,3,4].map(i => (
                 <div key={i} className="space-y-2">
                   <div className="h-4 w-24 bg-gray-800 rounded animate-pulse"></div>
                   <div className="h-2 w-full bg-gray-800 rounded animate-pulse"></div>
                 </div>
               ))
            ) : (
              data?.engineStats.map((engine) => (
                <div key={engine.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{engine.name}</span>
                    <span className="text-sm font-bold">{engine.score}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${engine.score}%`, backgroundColor: engine.color }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4">Latest Insights</p>
            <div className="space-y-4">
              {loading ? (
                <div className="h-20 w-full bg-gray-800 rounded animate-pulse"></div>
              ) : (
                data?.latestInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${insight.type === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <p className="text-sm text-gray-400">{insight.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
