'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Activity, Cpu, HardDrive, Zap, RefreshCcw, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '1h', '24h', '7d'
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filterByTime = (itemTimeStr: string) => {
    if (timeFilter === 'all') return true;
    const itemTime = new Date(itemTimeStr).getTime();
    const now = Date.now();
    const diff = now - itemTime;
    if (timeFilter === '1h') return diff <= 3600000;
    if (timeFilter === '24h') return diff <= 86400000;
    if (timeFilter === '7d') return diff <= 604800000;
    return true;
  };

  const filteredHistory = (data?.history || []).filter((item: any) => {
    const matchesText = item.agent.toLowerCase().includes(filter.toLowerCase()) || 
                       item.model.toLowerCase().includes(filter.toLowerCase());
    return matchesText && filterByTime(item.timestamp);
  });

  const sortedAndFilteredHistory = [...filteredHistory].sort((a: any, b: any) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate aggregate stats based on time filter
  const aggregates = filteredHistory.reduce((acc: any, curr: any) => {
    acc.total += curr.total;
    acc.input += curr.input;
    acc.output += curr.output;
    acc.cacheRead += (curr.cacheRead || 0);
    
    if (!acc.byModel[curr.model]) {
      acc.byModel[curr.model] = { total: 0, input: 0, output: 0 };
    }
    acc.byModel[curr.model].total += curr.total;
    acc.byModel[curr.model].input += curr.input;
    acc.byModel[curr.model].output += curr.output;
    
    return acc;
  }, { total: 0, input: 0, output: 0, cacheRead: 0, byModel: {} });

  const modelData = Object.entries(aggregates.byModel).map(([name, stats]: any) => ({
    name,
    total: stats.total,
    input: stats.input,
    output: stats.output
  }));

  const chartData = (data?.chartData || []).filter((d: any) => {
    if (timeFilter === 'all' || timeFilter === '7d') return true;
    // For 1h/24h, the daily aggregation in chartData might be too coarse, 
    // but we'll show the relevant days at least.
    const dTime = new Date(d.date).getTime();
    const now = new Date().setHours(0,0,0,0);
    const diff = now - dTime;
    return diff <= 86400000 * (timeFilter === '1h' ? 1 : 1); 
  });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="text-blue-500 w-8 h-8" />
            OpenClaw Pulse
          </h1>
          <p className="text-slate-400">Autonomous System Monitoring & Usage Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-300"
          >
            <option value="all">All Time</option>
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <input 
            type="text" 
            placeholder="Filter by agent or model..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <button 
            onClick={fetchStats}
            className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Tokens" value={aggregates.total.toLocaleString()} icon={<Zap className="text-yellow-500" />} />
        <StatCard title="Prompt (In)" value={aggregates.input.toLocaleString()} icon={<Cpu className="text-blue-500" />} />
        <StatCard title="Response (Out)" value={aggregates.output.toLocaleString()} icon={<Activity className="text-pink-500" />} />
        <StatCard title="Cache Savings" value={aggregates.cacheRead.toLocaleString()} icon={<HardDrive className="text-emerald-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Usage Over Time */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6 text-white">Usage History</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="tokens" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Distribution */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6 text-white">Model Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total"
                >
                  {modelData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {modelData.map((entry: any, index: number) => (
              <div key={`${entry.name}-${index}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate max-w-[120px]">{entry.name}</span>
                </div>
                <span className="font-medium text-slate-100">{(entry.total / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Detailed Usage Logs</h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 uppercase tracking-widest">
            {sortedAndFilteredHistory.length} Entries
          </span>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-6 py-4 font-semibold cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('timestamp')}>
                  Timestamp {sortConfig.key === 'timestamp' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-6 py-4 font-semibold cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('agent')}>
                  Agent {sortConfig.key === 'agent' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-6 py-4 font-semibold cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('model')}>
                  Model {sortConfig.key === 'model' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('input')}>
                  In {sortConfig.key === 'input' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('output')}>
                  Out {sortConfig.key === 'output' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSort('total')}>
                  Total {sortConfig.key === 'total' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedAndFilteredHistory.map((item: any, i: number) => (
                <tr key={i} className="text-sm hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap font-mono tabular-nums">
                    {new Date(item.timestamp).toLocaleString(undefined, {
                      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 uppercase tracking-tighter">
                      {item.agent}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-200">
                    {item.model}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 tabular-nums">
                    {item.input.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 tabular-nums">
                    {item.output.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    <span className="font-semibold text-white">{item.total.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value || '0'}</div>
    </div>
  );
}
