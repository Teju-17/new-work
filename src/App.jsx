import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  FileDown,
  FileSpreadsheet,
  Filter,
  Gauge,
  Info,
  Menu,
  Moon,
  Search,
  ShieldAlert,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const navItems = [
  { key: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
  { key: 'upload', label: 'Data Upload', icon: Upload },
  { key: 'signals', label: 'Feature Signals', icon: Activity },
  { key: 'results', label: 'Detection Results', icon: ShieldAlert },
  { key: 'explain', label: 'Explanation & Justification', icon: Info },
  { key: 'audit', label: 'Audit & Reports', icon: FileSpreadsheet },
  { key: 'algorithm', label: 'Algorithm Overview', icon: Gauge },
];

const accountData = [
  { username: 'tech_enthusiast_2024', score: 92.3, category: 'Fake' },
  { username: 'start_and_design_hub', score: 58.2, category: 'Suspicious' },
  { username: 'digital_nomad_life', score: 8.5, category: 'Genuine' },
  { username: 'market_watch_daily', score: 42.9, category: 'Suspicious' },
  { username: 'city_food_trails', score: 16.4, category: 'Genuine' },
  { username: 'crypto_giveaway_now', score: 86.1, category: 'Fake' },
];

const COLORS = { Genuine: '#22C55E', Suspicious: '#FACC15', Fake: '#EF4444' };
const BADGES = {
  Genuine: 'bg-[#DCFCE7] text-[#166534]',
  Suspicious: 'bg-[#FEF3C7] text-[#92400E]',
  Fake: 'bg-[#FEE2E2] text-[#991B1B]',
};

const card = 'bg-white rounded-xl border border-[#E5E7EB] shadow-sm';

const Fade = ({ children, className = '' }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className={className}>
    {children}
  </motion.div>
);

function StatCard({ label, value, icon: Icon, iconColor = 'text-[#3B82F6]' }) {
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#6B7280]">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-[#111827]">{value}</p>
        </div>
        <div className="rounded-lg bg-[#F9FAFB] p-2">
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [active, setActive] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 4;

  const stats = useMemo(() => {
    const total = accountData.length;
    const genuine = accountData.filter((a) => a.category === 'Genuine').length;
    const suspicious = accountData.filter((a) => a.category === 'Suspicious').length;
    const fake = accountData.filter((a) => a.category === 'Fake').length;
    return { total, genuine, suspicious, fake };
  }, []);

  const filtered = accountData.filter((item) => {
    const matchSearch = item.username.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || item.category === filter;
    return matchSearch && matchFilter;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const scoreBins = [
    { range: '0-20', count: 1 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 2 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 2 },
  ];

  const content = {
    overview: (
      <Fade className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Accounts" value={stats.total} icon={Users} />
          <StatCard label="Genuine Accounts" value={stats.genuine} icon={CheckCircle2} iconColor="text-[#166534]" />
          <StatCard label="Suspicious Accounts" value={stats.suspicious} icon={AlertTriangle} iconColor="text-[#92400E]" />
          <StatCard label="Fake Accounts" value={stats.fake} icon={ShieldAlert} iconColor="text-[#991B1B]" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className={`${card} p-5`}>
            <h3 className="mb-4 text-lg font-semibold">Category Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[{ name: 'Genuine', value: stats.genuine }, { name: 'Suspicious', value: stats.suspicious }, { name: 'Fake', value: stats.fake }]} dataKey="value" nameKey="name" outerRadius={90}>
                    {['Genuine', 'Suspicious', 'Fake'].map((k) => <Cell key={k} fill={COLORS[k]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={`${card} p-5`}>
            <h3 className="mb-4 text-lg font-semibold">Suspicion Score Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={scoreBins}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Fade>
    ),
    upload: (
      <Fade>
        <div className="mx-auto max-w-4xl space-y-4">
          <div className={`${card} p-6`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Upload Dataset</h3>
              <button className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563EB]">Upload CSV</button>
            </div>
            <div className="mb-4 rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-8 text-center text-[#6B7280]">Drag & Drop CSV File Here</div>
            <div className="mb-3 flex items-center justify-between text-sm text-[#6B7280]"><span>Rows: {accountData.length}</span><button className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 hover:shadow-sm">Reset</button></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border border-[#E5E7EB] text-sm">
                <thead className="bg-[#F9FAFB]"><tr><th className="border-b border-[#E5E7EB] p-3 text-left">Username</th><th className="border-b border-[#E5E7EB] p-3 text-left">Suspicion Score</th><th className="border-b border-[#E5E7EB] p-3 text-left">Category</th></tr></thead>
                <tbody>{accountData.map((r) => <tr key={r.username}><td className="border-b border-[#E5E7EB] p-3">{r.username}</td><td className="border-b border-[#E5E7EB] p-3">{r.score}%</td><td className="border-b border-[#E5E7EB] p-3">{r.category}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </Fade>
    ),
    signals: (
      <Fade className="space-y-4">
        {[
          { title: 'Profile Metadata Signals', desc: 'Signals derived from account profile structure and completeness.' },
          { title: 'Engagement Signals', desc: 'Interaction consistency across likes, comments, and share behaviors.' },
          { title: 'Temporal Activity Signals', desc: 'Posting rhythm and activity burst analysis over time.' },
        ].map((sec) => (
          <div key={sec.title} className={`${card} p-5`}>
            <h3 className="text-lg font-semibold">{sec.title}</h3>
            <p className="mb-4 text-sm text-[#6B7280]">{sec.desc}</p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="h-48"><ResponsiveContainer><LineChart data={[{ x: 'W1', y: 40 }, { x: 'W2', y: 56 }, { x: 'W3', y: 35 }, { x: 'W4', y: 61 }]}><CartesianGrid stroke="#E5E7EB" /><XAxis dataKey="x" /><YAxis /><Tooltip /><Line type="monotone" dataKey="y" stroke="#3B82F6" /></LineChart></ResponsiveContainer></div>
              <div className="h-48"><ResponsiveContainer><BarChart data={[{ x: 'A', y: 20 }, { x: 'B', y: 32 }, { x: 'C', y: 15 }]}><CartesianGrid stroke="#E5E7EB" /><XAxis dataKey="x" /><YAxis /><Tooltip /><Bar dataKey="y" fill="#3B82F6" /></BarChart></ResponsiveContainer></div>
              <div className="flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]"><div className="text-center"><p className="text-sm text-[#6B7280]">Signal Ratio</p><p className="text-3xl font-semibold">0.71</p></div></div>
            </div>
          </div>
        ))}
      </Fade>
    ),
    results: (
      <Fade className="space-y-4">
        <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">Model Used: Weighted Multi-Signal Heuristic Scoring Algorithm</div>
        <div className={`${card} p-5`}>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative"><Search className="absolute left-2 top-2.5 text-[#6B7280]" size={16} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search username" className="rounded-lg border border-[#E5E7EB] py-2 pl-8 pr-3 text-sm" /></div>
            <div className="relative"><Filter className="absolute left-2 top-2.5 text-[#6B7280]" size={16} /><select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="rounded-lg border border-[#E5E7EB] py-2 pl-8 pr-3 text-sm"><option>All</option><option>Genuine</option><option>Suspicious</option><option>Fake</option></select></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-[#E5E7EB] text-[#6B7280]"><th className="p-3 text-left">Username</th><th className="p-3 text-left">Suspicion Score</th><th className="p-3 text-left">Category Badge</th><th className="p-3 text-left">Action</th></tr></thead>
              <tbody>{paginated.map((r) => <tr key={r.username} className="border-b border-[#E5E7EB]"><td className="p-3">{r.username}</td><td className="p-3"><div className="w-52 rounded-full bg-[#E5E7EB]"><div className="h-2 rounded-full bg-[#3B82F6]" style={{ width: `${r.score}%` }} /></div><span className="text-xs text-[#6B7280]">{r.score}%</span></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${BADGES[r.category]}`}>{r.category}</span></td><td className="p-3"><button className="rounded-lg bg-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2563EB]">View Explanation</button></td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm"><span className="text-[#6B7280]">Page {page} of {totalPages}</span><div className="space-x-2"><button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-[#E5E7EB] px-2 py-1">Prev</button><button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border border-[#E5E7EB] px-2 py-1">Next</button></div></div>
        </div>
      </Fade>
    ),
    explain: (
      <Fade className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={`${card} p-5 space-y-3`}>
          <h3 className="text-lg font-semibold">Account Summary</h3>
          <p className="text-sm text-[#6B7280]">tech_enthusiast_2024</p>
          <div className="flex items-center gap-2"><p className="text-4xl font-semibold">92.3%</p><Info size={16} className="text-[#6B7280]" title="Score computed using weighted multi-signal heuristic model." /></div>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${BADGES.Fake}`}>Fake</span>
        </div>
        <div className={`${card} p-5 space-y-4`}>
          <h3 className="text-lg font-semibold">Analysis Summary</h3>
          <p className="text-sm text-[#6B7280]">High-risk characteristics include abnormal follower ratio, repetitive posting behavior, and suspicious username pattern. Rules Triggered: 7.</p>
          {[['Follower Ratio', 95], ['Engagement Rate', 84], ['Posting Frequency', 78], ['Username Pattern', 90]].map(([k, v]) => <div key={k}><div className="mb-1 flex justify-between text-sm"><span>{k}</span><span>{v}%</span></div><div className="h-2 rounded-full bg-[#E5E7EB]"><div className="h-2 rounded-full bg-[#3B82F6]" style={{ width: `${v}%` }} /></div></div>)}
        </div>
      </Fade>
    ),
    audit: (
      <Fade className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Audited Accounts" value={stats.total} icon={Database} />
          <StatCard label="Flagged" value={stats.suspicious + stats.fake} icon={AlertTriangle} iconColor="text-[#92400E]" />
          <StatCard label="Report Time" value="2026-02-11" icon={FileDown} />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className={`${card} p-5`}>
            <h3 className="mb-4 text-lg font-semibold">Audit Category Split</h3>
            <div className="h-64"><ResponsiveContainer><PieChart><Pie data={[{ name: 'Genuine', value: stats.genuine }, { name: 'Suspicious', value: stats.suspicious }, { name: 'Fake', value: stats.fake }]} dataKey="value" outerRadius={80}>{['Genuine', 'Suspicious', 'Fake'].map((k) => <Cell key={k} fill={COLORS[k]} />)}</Pie><Legend /></PieChart></ResponsiveContainer></div>
          </div>
          <div className={`${card} p-5 space-y-3`}>
            <h3 className="text-lg font-semibold">Suspicious Account List</h3>
            {accountData.filter((a) => a.category !== 'Genuine').map((a) => <div key={a.username} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3"><span>{a.username}</span><span className={`rounded-full px-2 py-1 text-xs ${BADGES[a.category]}`}>{a.category}</span></div>)}
            <div className="flex gap-2"><button className="rounded-lg bg-[#3B82F6] px-3 py-2 text-sm text-white hover:bg-[#2563EB]">Export CSV</button><button className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">Export PDF</button></div>
          </div>
        </div>
      </Fade>
    ),
    algorithm: (
      <Fade className="space-y-6">
        <div className={`${card} p-5`}>
          <h3 className="text-lg font-semibold">Detection Algorithm</h3>
          <p className="text-sm text-[#6B7280]">Weighted Multi-Signal Heuristic Scoring Model</p>
          <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm">
            Suspicion Score =<br />(w1 × Follower Ratio) +<br />(w2 × Engagement Rate) +<br />(w3 × Posting Frequency) +<br />(w4 × Username Pattern)
          </div>
          <p className="mt-3 text-sm text-[#6B7280]">The model aggregates normalized features with interpretable weights and maps the final score to risk thresholds for actionable decision support.</p>
        </div>
        <div className={`${card} p-5`}>
          <h3 className="mb-4 text-lg font-semibold">Algorithm Flow Steps</h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">{['Data Acquisition', 'Feature Extraction', 'Weight Assignment', 'Score Aggregation', 'Threshold Classification'].map((s, i) => <div key={s} className="relative rounded-lg border border-[#E5E7EB] p-3"><div className="mb-2 h-6 w-6 rounded-full bg-[#3B82F6] text-center text-sm text-white">{i + 1}</div><p className="text-sm font-medium">{s}</p><p className="text-xs text-[#6B7280]">Step {i + 1} of pipeline.</p>{i < 4 && <span className="hidden lg:block absolute -right-2 top-1/2 text-[#9CA3AF]">→</span>}</div>)}</div>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className={`${card} p-5`}>
            <h3 className="mb-4 text-lg font-semibold">Feature Weight Contribution</h3>
            <div className="h-72"><ResponsiveContainer><BarChart data={[{ f: 'Follower Ratio', w: 25 }, { f: 'Engagement Rate', w: 25 }, { f: 'Posting Frequency', w: 20 }, { f: 'Username Pattern', w: 20 }, { f: 'Profile Completeness', w: 10 }]} layout="vertical"><CartesianGrid stroke="#E5E7EB" /><XAxis type="number" unit="%" /><YAxis type="category" dataKey="f" width={130} /><Tooltip /><Bar dataKey="w" fill="#3B82F6" /></BarChart></ResponsiveContainer></div>
          </div>
          <div className={`${card} p-5`}>
            <h3 className="mb-4 text-lg font-semibold">Threshold Visualization</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[#E5E7EB] bg-[#DCFCE7] p-4 text-[#166534]"><p className="font-semibold">Genuine</p><p className="text-sm">Score &lt; 0.3</p></div>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#FEF3C7] p-4 text-[#92400E]"><p className="font-semibold">Suspicious</p><p className="text-sm">0.3 – 0.6</p></div>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#FEE2E2] p-4 text-[#991B1B]"><p className="font-semibold">Fake</p><p className="text-sm">0.6+</p></div>
            </div>
          </div>
        </div>
      </Fade>
    ),
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-[#111827]">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 lg:hidden" onClick={() => setMobileOpen((v) => !v)}><Menu size={18} /></button>
            <div><h1 className="text-2xl font-bold">Suspicious Follower Detection System</h1><p className="text-sm text-[#6B7280]">Heuristic & Explainable Analysis Dashboard</p></div>
          </div>
          <button className="rounded-lg border border-[#E5E7EB] p-2"><Moon size={16} className="text-[#6B7280]" /></button>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px] pt-20">
        <aside className={`fixed left-0 top-20 h-[calc(100vh-80px)] w-72 border-r border-[#E5E7EB] bg-white p-4 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="space-y-1">{navItems.map((n) => { const Icon = n.icon; const isActive = active === n.key; return <button key={n.key} onClick={() => { setActive(n.key); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'text-[#374151] hover:bg-[#F9FAFB]'}`}><Icon size={16} />{n.label}</button>; })}</nav>
        </aside>
        <main className="w-full p-4 lg:ml-72 lg:p-6">{content[active]}</main>
      </div>
    </div>
  );
}

export default App;
