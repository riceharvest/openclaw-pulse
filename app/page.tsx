'use client';

import { useEffect, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Activity, Cpu, HardDrive, Zap, RefreshCcw, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

interface HistoryItem {
  timestamp: string;
  agent: string;
  model: string;
  input: number;
  output: number;
  cacheRead: number;
  total: number;
  action: string;
}

interface ChartDataItem {
  date: string;
  tokens: number;
}

export default function Dashboard() {
  const [data, setData] = useState<{
    history: HistoryItem[];
    chartData: ChartDataItem[];
    sessions: Array<{ id: string; agent: string; tokens: number }>;
    byModel: Record<string, { input: number; output: number; total: number; count: number }>;
    totalTokens: number;
    totalInput: number;
    totalOutput: number;
    totalCacheRead: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
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
    let interval: NodeJS.Timeout;
    async function load() {
      await fetchStats();
      interval = setInterval(() => setNow(Date.now()), 60000);
    }
    load();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const filterByTime = (itemTimeStr: string) => {
    if (timeFilter === 'all') return true;
    const itemTime = new Date(itemTimeStr).getTime();
    const diff = now - itemTime;
    if (timeFilter === '1h') return diff <= 3600000;
    if (timeFilter === '24h') return diff <= 86400000;
    if (timeFilter === '7d') return diff <= 604800000;
    return true;
  };

  const filteredHistory = (data?.history || []).filter((item) => {
    const matchesText = item.agent.toLowerCase().includes(filter.toLowerCase()) ||
      item.model.toLowerCase().includes(filter.toLowerCase());
    return matchesText && filterByTime(item.timestamp);
  });

  const sortedAndFilteredHistory = [...filteredHistory].sort((a, b) => {
    const aVal = a[sortConfig.key as keyof HistoryItem];
    const bVal = b[sortConfig.key as keyof HistoryItem];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate aggregate stats based on time filter
  const aggregates = filteredHistory.reduce((acc, curr) => {
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
  }, { total: 0, input: 0, output: 0, cacheRead: 0, byModel: {} as Record<string, { total: number; input: number; output: number }> });

  const modelData = Object.entries(aggregates.byModel).map(([name, stats]) => ({
    name,
    total: stats.total,
    input: stats.input,
    output: stats.output
  })).sort((a, b) => b.total - a.total);

  const chartData = (data?.chartData || []).filter((d) => {
    if (timeFilter === 'all' || timeFilter === '7d') return true;
    const dTime = new Date(d.date).getTime();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const diff = startOfDay - dTime;
    return diff <= 86400000;
  });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  if (loading && !data) return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
      </div>
      <div className="z-10 relative animate-spin">
        <div className="p-4 rounded-full glass-panel border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <RefreshCcw className="text-blue-400 w-10 h-10" />
        </div>
      </div>
      <p className="mt-6 text-blue-200 font-medium tracking-wide z-10 animate-pulse">
        Initializing Pulse Engine...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-slate-200 p-4 md:p-8 font-sans relative">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800/60 shadow-2xl animate-fade-in-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500" />
              <div className="relative p-4 glass-panel rounded-2xl border border-white/10 flex items-center justify-center shadow-inner">
                <ShieldCheck className="text-blue-400 w-8 h-8" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1 font-outfit text-gradient bg-gradient-to-br from-white to-slate-400">
                OpenClaw Pulse
              </h1>
              <p className="text-slate-400 text-sm font-medium">Autonomous System Monitoring & Usage Dashboard</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-4">
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="appearance-none glass-panel border border-slate-700 hover:border-blue-500/50 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-200 font-medium transition-all pr-10 cursor-pointer shadow-lg"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Time Overview</option>
                <option value="1h" className="bg-slate-900 text-slate-200">Last Hour Pulse</option>
                <option value="24h" className="bg-slate-900 text-slate-200">Last 24 Hours</option>
                <option value="7d" className="bg-slate-900 text-slate-200">Last 7 Days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              <input
                type="text"
                placeholder="Search agents or models..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="relative glass-panel border border-slate-700 hover:border-slate-600 px-4 py-2.5 rounded-xl text-sm focus:outline-none text-slate-200 w-full md:w-64 transition-all placeholder:text-slate-500 shadow-lg"
              />
            </div>

            <button
              onClick={fetchStats}
              disabled={loading}
              className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-500/50 px-5 py-2.5 rounded-xl hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center gap-2 font-medium"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <RefreshCcw className={`w-4 h-4 text-blue-100 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-white">Refresh</span>
            </button>
          </div>
        </header>

        {/* Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tokens"
            value={aggregates.total.toLocaleString()}
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            color="from-amber-500/20 to-orange-500/20"
            border="group-hover:border-amber-500/50"
            className="animate-fade-in-up delay-100"
          />
          <StatCard
            title="Prompt (In)"
            value={aggregates.input.toLocaleString()}
            icon={<Cpu className="w-5 h-5 text-blue-400" />}
            color="from-blue-500/20 to-cyan-500/20"
            border="group-hover:border-blue-500/50"
            className="animate-fade-in-up delay-200"
          />
          <StatCard
            title="Response (Out)"
            value={aggregates.output.toLocaleString()}
            icon={<Activity className="w-5 h-5 text-pink-400" />}
            color="from-pink-500/20 to-rose-500/20"
            border="group-hover:border-pink-500/50"
            className="animate-fade-in-up delay-300"
          />
          <StatCard
            title="Cache Savings"
            value={aggregates.cacheRead.toLocaleString()}
            icon={<HardDrive className="w-5 h-5 text-emerald-400" />}
            color="from-emerald-500/20 to-teal-500/20"
            border="group-hover:border-emerald-500/50"
            className="animate-fade-in-up delay-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Usage Over Time */}
          <div className="lg:col-span-2 glass-panel border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-2xl animate-fade-in-up delay-500">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

            <h3 className="text-xl font-outfit font-semibold mb-6 text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Usage History
            </h3>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    tickFormatter={(str) => {
                      if (!str) return '';
                      const date = new Date(str);
                      return isNaN(date.getTime()) ? str : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    dx={-10}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4', fill: 'rgba(59, 130, 246, 0.05)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTokens)"
                    activeDot={{ r: 6, fill: "#fff", stroke: "#3b82f6", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Distribution */}
          <div className="glass-panel border border-slate-800 p-6 rounded-3xl relative shadow-2xl flex flex-col animate-fade-in-up delay-600">
            <h3 className="text-xl font-outfit font-semibold mb-2 text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-400" />
              Model Distribution
            </h3>

            <div className="h-[240px] w-full flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelData}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="total"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={2}
                    cornerRadius={8}
                  >
                    {modelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {modelData.map((entry, index) => (
                <div
                  key={`${entry.name}-${index}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/20 hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 transition-colors group animate-fade-in-up"
                  style={{ animationDelay: `${700 + index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full relative z-10" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <div className="absolute inset-0 rounded-full blur-sm opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors truncate max-w-[140px]">{entry.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-slate-100 text-sm">{(entry.total / 1000).toFixed(1)}k</span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-wider">{(entry.total / aggregates.total * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
            <h3 className="text-xl font-outfit font-semibold text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              Detailed Usage Logs
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest hidden sm:block">
                {sortedAndFilteredHistory.length} Live Entries
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 text-xs uppercase tracking-widest text-slate-400 font-semibold shadow-sm">
                  <th className="px-6 py-5 cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('timestamp')}>
                    <div className="flex items-center gap-1">
                      Timestamp
                      <SortIcon active={sortConfig.key === 'timestamp'} direction={sortConfig.direction} />
                    </div>
                  </th>
                  <th className="px-6 py-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('agent')}>
                    <div className="flex items-center gap-1">
                      Agent <SortIcon active={sortConfig.key === 'agent'} direction={sortConfig.direction} />
                    </div>
                  </th>
                  <th className="px-6 py-5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('model')}>
                    <div className="flex items-center gap-1">
                      Model <SortIcon active={sortConfig.key === 'model'} direction={sortConfig.direction} />
                    </div>
                  </th>
                  <th className="px-6 py-5 cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('input')}>
                    <div className="flex items-center justify-end gap-1">
                      Input <SortIcon active={sortConfig.key === 'input'} direction={sortConfig.direction} />
                    </div>
                  </th>
                  <th className="px-6 py-5 cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('output')}>
                    <div className="flex items-center justify-end gap-1">
                      Output <SortIcon active={sortConfig.key === 'output'} direction={sortConfig.direction} />
                    </div>
                  </th>
                  <th className="px-6 py-5 cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('total')}>
                    <div className="flex items-center justify-end gap-1 text-blue-400">
                      Total <SortIcon active={sortConfig.key === 'total'} direction={sortConfig.direction} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedAndFilteredHistory.map((item, i) => (
                  <tr
                    key={`${item.timestamp}-${item.total}-${i}`}
                    className="text-sm hover:bg-white/[0.03] transition-colors group animate-fade-in-up"
                    style={{ animationDelay: `${800 + Math.min(i * 50, 500)}ms` }}
                  >
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap font-mono tabular-nums">
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-300 text-[10px] font-bold border border-blue-500/20 uppercase tracking-widest shadow-sm">
                        {item.agent}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-200 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
                        {item.model.replace('models/', '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 tabular-nums">
                      {item.input.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 tabular-nums">
                      {item.output.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      <span className="font-bold text-white text-[15px]">{item.total.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
                {sortedAndFilteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No usage data found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents

function StatCard({ title, value, icon, color, border, className = "" }: { title: string, value: string, icon: React.ReactNode, color: string, border: string, className?: string }) {
  return (
    <div
      className={`relative glass-panel rounded-3xl p-6 group cursor-default transition-all duration-300 border border-slate-800 ${border} hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/50 group-hover:scale-110 transition-transform shadow-inner">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-outfit font-bold text-white tracking-tight">{value || '0'}</div>
      </div>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const labelStr = label ?? '';
    const formattedDate = new Date(labelStr);
    const dateStr = isNaN(formattedDate.getTime()) ? labelStr : formattedDate.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
      <div className="glass-panel p-4 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-xl">
        <p className="text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider border-b border-slate-700 pb-2">{dateStr}</p>
        <p className="text-blue-400 font-bold text-xl font-outfit">
          {payload[0].value.toLocaleString()} <span className="text-sm font-medium text-slate-400 lowercase">tokens</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-4 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-xl flex flex-col gap-1">
        <p className="text-slate-200 font-bold mb-1 border-b border-slate-700 pb-2">{payload[0].name}</p>
        <p className="text-white font-medium flex justify-between gap-4">
          <span className="text-slate-400">Total:</span>
          <span>{payload[0].value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

const SortIcon = ({ active, direction }: { active: boolean, direction: string }) => {
  if (!active) return <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />;
  return direction === 'desc'
    ? <ChevronDown className="w-3 h-3 text-blue-400" />
    : <ChevronUp className="w-3 h-3 text-blue-400" />;
};

function PieChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
