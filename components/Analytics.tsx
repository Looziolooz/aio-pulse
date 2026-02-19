
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, Filter, Download, Loader2 } from 'lucide-react';
import { getAnalyticsData } from '../services/geminiService';
import { AnalyticsData } from '../types';

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getAnalyticsData();
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Analytics</h1>
          <p className="text-gray-400">Deep-dive into cross-platform generative search metrics.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />} Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Visibility Convergence</h3>
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-indigo-400"><div className="w-2 h-2 rounded-full bg-indigo-500" /> AI-Search</span>
              <span className="flex items-center gap-1.5 text-gray-500"><div className="w-2 h-2 rounded-full bg-gray-500" /> Traditional</span>
            </div>
          </div>
          <div className="h-[350px]">
            {loading ? (
              <div className="w-full h-full bg-black/20 animate-pulse rounded-xl"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.visibilityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0c14', border: '1px solid #1f2937', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="ai" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="desktop" stroke="#4b5563" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <h3 className="font-bold flex items-center gap-2 mb-8"><PieIcon className="w-5 h-5 text-purple-400" /> Intent Distribution</h3>
          <div className="h-[250px] mb-8">
            {loading ? (
              <div className="w-full h-full bg-black/20 animate-pulse rounded-full"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data?.distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0a0c14', border: '1px solid #1f2937', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-3">
            {loading ? <div className="h-20 bg-black/20 animate-pulse"></div> : data?.distribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-gray-400 font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
        <h3 className="font-bold flex items-center gap-2 mb-6"><BarChart3 className="w-5 h-5 text-amber-400" /> Top Performing Clusters</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="pb-4 pl-2">Keyword Cluster</th>
                <th className="pb-4">Avg. Rank</th>
                <th className="pb-4">Search Volume</th>
                <th className="pb-4 text-right pr-2">AIO Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                [1,2,3,4].map(i => <tr key={i}><td colSpan={4} className="py-8 bg-black/10 animate-pulse"></td></tr>)
              ) : (
                data?.keywords.map((kw, i) => (
                  <tr key={i} className="group hover:bg-black/20 transition-colors">
                    <td className="py-4 pl-2"><div className="font-semibold text-gray-200">{kw.name}</div></td>
                    <td className="py-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-800 text-xs font-bold">#{kw.rank}</div>
                    </td>
                    <td className="py-4 text-sm text-gray-400">{kw.volume}</td>
                    <td className="py-4 text-right pr-2">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${kw.impact}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">{kw.impact}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
