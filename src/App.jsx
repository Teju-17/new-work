import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
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
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const REQUIRED_COLUMNS = [
  'user_id',
  'username',
  'followers_count',
  'following_count',
  'avg_likes',
  'avg_comments',
  'total_posts',
  'account_age_days',
  'profile_complete',
];

const EPSILON = 1e-9;

const ProjectOverviewGraphic = () => (
  <svg viewBox="0 0 1200 500" className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="500" rx="20" fill="#F9FAFB" />
    <rect x="40" y="40" width="1120" height="420" rx="16" fill="#FFFFFF" stroke="#E5E7EB" />
    <text x="80" y="110" fill="#111827" fontFamily="Inter, Arial, sans-serif" fontSize="34" fontWeight="700">AI Fake Follower Detection</text>
    <text x="80" y="148" fill="#6B7280" fontFamily="Inter, Arial, sans-serif" fontSize="18">Entropy-weighted risk scoring + influencer credibility</text>

    <rect x="80" y="190" width="170" height="76" rx="12" fill="#EFF6FF" stroke="#DBEAFE" />
    <text x="100" y="222" fill="#1D4ED8" fontFamily="Inter, Arial, sans-serif" fontSize="16" fontWeight="600">1. Load Data</text>

    <path d="M262 228H326" stroke="#9CA3AF" strokeWidth="2" />
    <path d="M326 228L318 222V234L326 228Z" fill="#9CA3AF" />

    <rect x="338" y="190" width="190" height="76" rx="12" fill="#EFF6FF" stroke="#DBEAFE" />
    <text x="358" y="222" fill="#1D4ED8" fontFamily="Inter, Arial, sans-serif" fontSize="16" fontWeight="600">2. Preprocess</text>

    <path d="M540 228H604" stroke="#9CA3AF" strokeWidth="2" />
    <path d="M604 228L596 222V234L604 228Z" fill="#9CA3AF" />

    <rect x="616" y="190" width="220" height="76" rx="12" fill="#EFF6FF" stroke="#DBEAFE" />
    <text x="636" y="222" fill="#1D4ED8" fontFamily="Inter, Arial, sans-serif" fontSize="16" fontWeight="600">3. Entropy Risk Score</text>

    <path d="M848 228H912" stroke="#9CA3AF" strokeWidth="2" />
    <path d="M912 228L904 222V234L912 228Z" fill="#9CA3AF" />

    <rect x="924" y="190" width="200" height="76" rx="12" fill="#EFF6FF" stroke="#DBEAFE" />
    <text x="944" y="222" fill="#1D4ED8" fontFamily="Inter, Arial, sans-serif" fontSize="16" fontWeight="600">4. Label + Credibility</text>

    <rect x="80" y="304" width="1044" height="116" rx="12" fill="#F9FAFB" stroke="#E5E7EB" />
    <text x="104" y="338" fill="#111827" fontFamily="Inter, Arial, sans-serif" fontSize="18" fontWeight="600">Outputs</text>
    <text x="104" y="366" fill="#6B7280" fontFamily="Inter, Arial, sans-serif" fontSize="14">RiskScore, Label (Genuine / Suspicious / Bot), system metrics (Accuracy/F1), and final influencer credibility score.</text>
  </svg>
);

const navItems = [
  { key: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
  { key: 'upload', label: 'Data Upload', icon: Upload },
  { key: 'results', label: 'Detection Results', icon: ShieldAlert },
  { key: 'explain', label: 'Performance & Credibility', icon: Info },
  { key: 'audit', label: 'Audit & Reports', icon: FileSpreadsheet },
  { key: 'algorithm', label: 'Algorithm Overview', icon: Gauge },
];

const seedData = [
  { user_id: 'u001', username: 'fashion_hub', followers_count: 12000, following_count: 9100, avg_likes: 24, avg_comments: 3, total_posts: 92, account_age_days: 140, profile_complete: 0 },
  { user_id: 'u002', username: 'travel_with_ana', followers_count: 8600, following_count: 1400, avg_likes: 180, avg_comments: 19, total_posts: 465, account_age_days: 1300, profile_complete: 1 },
  { user_id: 'u003', username: 'fitcoach_james', followers_count: 23100, following_count: 2800, avg_likes: 410, avg_comments: 51, total_posts: 710, account_age_days: 1500, profile_complete: 1 },
  { user_id: 'u004', username: 'quickmoney_999', followers_count: 4200, following_count: 6800, avg_likes: 8, avg_comments: 1, total_posts: 38, account_age_days: 76, profile_complete: 0 },
];

const COLORS = { Genuine: '#22C55E', Suspicious: '#FACC15', Bot: '#EF4444' };
const BADGES = {
  Genuine: 'bg-[#DCFCE7] text-[#166534]',
  Suspicious: 'bg-[#FEF3C7] text-[#92400E]',
  Bot: 'bg-[#FEE2E2] text-[#991B1B]',
};
const card = 'bg-white rounded-xl border border-[#E5E7EB] shadow-sm';

const num = (v) => Number.parseFloat(v ?? 0) || 0;
const clamp = (v) => Math.min(1, Math.max(0, v));

const Fade = ({ children, className = '' }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className={className}>{children}</motion.div>
);

function StatCard({ label, value, icon: Icon, iconColor = 'text-[#3B82F6]' }) {
  return <div className={`${card} p-5`}><div className="flex items-start justify-between"><div><p className="text-sm text-[#6B7280]">{label}</p><p className="mt-2 text-3xl font-semibold text-[#111827]">{value}</p></div><div className="rounded-lg bg-[#F9FAFB] p-2"><Icon size={20} className={iconColor} /></div></div></div>;
}

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/);
  if (rows.length < 2) return [];
  const headers = rows[0].split(',').map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((line) => line.split(',').map((v) => v.trim())).filter((parts) => parts.length >= 2).map((parts) => Object.fromEntries(headers.map((h, i) => [h, parts[i] ?? ''])));
}

function normalizeColumn(rows, key) {
  const values = rows.map((r) => num(r[key]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  return rows.map((r) => ({ ...r, [`norm_${key}`]: clamp((num(r[key]) - min) / (max - min + EPSILON)) }));
}

function entropyWeights(scoreRows) {
  const cols = ['profile_score', 'engagement_score', 'temporal_score'];
  const n = scoreRows.length;
  const k = 1 / Math.log(Math.max(2, n));
  const sums = cols.map((c) => scoreRows.reduce((s, r) => s + (num(r[c]) + EPSILON), 0));

  const entropy = cols.map((c, ci) => {
    const e = -k * scoreRows.reduce((acc, r) => {
      const p = (num(r[c]) + EPSILON) / (sums[ci] + EPSILON);
      return acc + p * Math.log(p);
    }, 0);
    return clamp(e);
  });

  const d = entropy.map((e) => 1 - e);
  const dSum = d.reduce((s, x) => s + x, 0) || 1;
  return { profile: d[0] / dSum, engagement: d[1] / dSum, temporal: d[2] / dSum };
}

function toLabel(score) {
  if (score < 0.4) return 'Genuine';
  if (score <= 0.7) return 'Suspicious';
  return 'Bot';
}

function enrichData(rows) {
  const base = rows.map((r, idx) => ({
    ...r,
    user_id: r.user_id || `u_${idx + 1}`,
    username: r.username || `user_${idx + 1}`,
    followers_count: num(r.followers_count),
    following_count: num(r.following_count),
    avg_likes: num(r.avg_likes),
    avg_comments: num(r.avg_comments),
    total_posts: num(r.total_posts),
    account_age_days: num(r.account_age_days),
    profile_complete: num(r.profile_complete),
  }));

  const withFeatures = base.map((r) => ({
    ...r,
    ratio: r.followers_count / (r.following_count + 1),
    engagement_ratio: (r.avg_likes + r.avg_comments) / (r.followers_count + 1),
    activity_rate: r.total_posts / (r.account_age_days + 1),
  }));

  let normalized = normalizeColumn(withFeatures, 'ratio');
  normalized = normalizeColumn(normalized, 'engagement_ratio');
  normalized = normalizeColumn(normalized, 'activity_rate');
  normalized = normalizeColumn(normalized, 'account_age_days');

  const withScores = normalized.map((r) => {
    const ratioRisk = 1 - r.norm_ratio;
    const ageRisk = 1 - r.norm_account_age_days;
    const profileRisk = 1 - clamp(r.profile_complete);
    const profileScore = (ratioRisk + ageRisk + profileRisk) / 3;
    const engagementScore = 1 - r.norm_engagement_ratio;
    const temporalScore = r.norm_activity_rate;
    return { ...r, ratio_risk: ratioRisk, age_risk: ageRisk, profile_risk: profileRisk, profile_score: profileScore, engagement_score: engagementScore, temporal_score: temporalScore };
  });

  const weights = entropyWeights(withScores);

  const scored = withScores.map((r) => {
    const riskScore = weights.profile * r.profile_score + weights.engagement * r.engagement_score + weights.temporal * r.temporal_score;
    const label = toLabel(riskScore);
    return {
      ...r,
      risk_score: Number(riskScore.toFixed(4)),
      score_percent: Number((riskScore * 100).toFixed(1)),
      label,
      inferred_ground_truth: r.engagement_ratio < 0.015 || r.profile_complete < 0.5 ? 'Bot' : 'Genuine',
    };
  });

  return { scored, weights };
}

function performanceMetrics(rows) {
  const yTrue = rows.map((r) => (r.inferred_ground_truth === 'Bot' ? 1 : 0));
  const yPred = rows.map((r) => (r.label === 'Bot' ? 1 : 0));
  const tp = yTrue.filter((v, i) => v === 1 && yPred[i] === 1).length;
  const tn = yTrue.filter((v, i) => v === 0 && yPred[i] === 0).length;
  const fp = yTrue.filter((v, i) => v === 0 && yPred[i] === 1).length;
  const fn = yTrue.filter((v, i) => v === 1 && yPred[i] === 0).length;

  const accuracy = (tp + tn) / Math.max(1, rows.length);
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const f1 = (2 * precision * recall) / Math.max(EPSILON, precision + recall);

  return { accuracy, precision, recall, f1, confusion: { tp, tn, fp, fn } };
}

function credibilityScore(rows) {
  const n = rows.length;
  const ng = rows.filter((r) => r.label === 'Genuine').length;
  const ns = rows.filter((r) => r.label === 'Suspicious').length;
  return (ng + 0.5 * ns) / Math.max(1, n);
}

function App() {
  const [active, setActive] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);

  const seeded = useMemo(() => enrichData(seedData), []);
  const [dataRows, setDataRows] = useState(seeded.scored);
  const [weights, setWeights] = useState(seeded.weights);
  const [previewRows, setPreviewRows] = useState(seedData);
  const [previewHeaders, setPreviewHeaders] = useState(Object.keys(seedData[0] || {}));
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const perPage = 6;

  const metrics = useMemo(() => performanceMetrics(dataRows), [dataRows]);
  const credibility = useMemo(() => credibilityScore(dataRows), [dataRows]);

  const stats = useMemo(() => ({
    total: dataRows.length,
    genuine: dataRows.filter((a) => a.label === 'Genuine').length,
    suspicious: dataRows.filter((a) => a.label === 'Suspicious').length,
    bots: dataRows.filter((a) => a.label === 'Bot').length,
  }), [dataRows]);

  const filtered = dataRows.filter((item) => (item.username.toLowerCase().includes(search.toLowerCase())) && (filter === 'All' || item.label === filter));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError('');
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Please upload a CSV file.');
      return;
    }

    const parsedRaw = parseCsv(await file.text());
    if (!parsedRaw.length) {
      setUploadError('No valid rows found in CSV.');
      return;
    }

    const missing = REQUIRED_COLUMNS.filter((col) => !(col in parsedRaw[0]));
    if (missing.length > 0) {
      setUploadError(`Missing required columns: ${missing.join(', ')}`);
      return;
    }

    const processed = enrichData(parsedRaw);
    setPreviewRows(parsedRaw);
    setPreviewHeaders(Object.keys(parsedRaw[0] || {}));
    setDataRows(processed.scored);
    setWeights(processed.weights);
    setPage(1);
  };

  const content = {
    overview: <Fade className="space-y-6"><div className={`${card} p-5`}><h3 className="text-lg font-semibold">Project Overview</h3><p className="mt-2 text-sm text-[#6B7280]">End-to-end AI/ML style pipeline for fake follower detection and influencer credibility scoring.</p></div><div className={`${card} p-4`}><ProjectOverviewGraphic /></div></Fade>,
    upload: <Fade><div className="mx-auto max-w-5xl space-y-4"><div className={`${card} p-6`}><input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} /><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">Upload Dataset</h3><button className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white" onClick={() => fileInputRef.current?.click()}>Upload CSV</button></div><div className={`mb-4 rounded-xl border-2 border-dashed p-8 text-center text-[#6B7280] ${dragActive ? 'border-[#3B82F6] bg-[#EFF6FF]' : 'border-[#E5E7EB] bg-[#F9FAFB]'}`} onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}>Drag & Drop CSV File Here<p className="mt-2 text-xs text-[#9CA3AF]">Required columns: {REQUIRED_COLUMNS.join(', ')}</p></div>{uploadError && <p className="mb-3 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-2 text-sm text-[#991B1B]">{uploadError}</p>}<div className="overflow-x-auto"><table className="w-full min-w-[960px] border border-[#E5E7EB] text-sm"><thead className="bg-[#F9FAFB]"><tr>{previewHeaders.map((header) => <th key={header} className="border-b border-[#E5E7EB] p-3 text-left whitespace-nowrap">{header}</th>)}</tr></thead><tbody>{previewRows.map((row, index) => <tr key={row.user_id || index}>{previewHeaders.map((header) => <td key={`${index}-${header}`} className="border-b border-[#E5E7EB] p-3 whitespace-nowrap">{String(row[header] ?? '')}</td>)}</tr>)}</tbody></table></div></div></div></Fade>,
    results: <Fade className="space-y-4"><div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-3 text-sm text-[#1D4ED8]">Model Used: Entropy-Weighted Risk Scoring Algorithm</div><div className={`${card} p-5`}><div className="mb-4 flex flex-wrap gap-3"><div className="relative"><Search className="absolute left-2 top-2.5 text-[#6B7280]" size={16} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search username" className="rounded-lg border border-[#E5E7EB] py-2 pl-8 pr-3 text-sm" /></div><div className="relative"><Filter className="absolute left-2 top-2.5 text-[#6B7280]" size={16} /><select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="rounded-lg border border-[#E5E7EB] py-2 pl-8 pr-3 text-sm"><option>All</option><option>Genuine</option><option>Suspicious</option><option>Bot</option></select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-[#E5E7EB] text-[#6B7280]"><th className="p-3 text-left">Username</th><th className="p-3 text-left">Risk Score</th><th className="p-3 text-left">Label</th></tr></thead><tbody>{paginated.map((r) => <tr key={r.username} className="border-b border-[#E5E7EB]"><td className="p-3">{r.username}</td><td className="p-3"><div className="w-52 rounded-full bg-[#E5E7EB]"><div className="h-2 rounded-full bg-[#3B82F6]" style={{ width: `${r.score_percent}%` }} /></div><span className="text-xs text-[#6B7280]">{r.risk_score.toFixed(4)}</span></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${BADGES[r.label]}`}>{r.label}</span></td></tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between text-sm"><span className="text-[#6B7280]">Page {page} of {totalPages}</span><div className="space-x-2"><button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-[#E5E7EB] px-2 py-1">Prev</button><button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border border-[#E5E7EB] px-2 py-1">Next</button></div></div></div></Fade>,
    explain: <Fade className="space-y-6"><div className="grid grid-cols-1 gap-4 md:grid-cols-4"><StatCard label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`} icon={CheckCircle2} iconColor="text-[#166534]" /><StatCard label="F1 Score" value={metrics.f1.toFixed(3)} icon={Info} /><StatCard label="Precision" value={metrics.precision.toFixed(3)} icon={AlertTriangle} iconColor="text-[#92400E]" /><StatCard label="Recall" value={metrics.recall.toFixed(3)} icon={Database} /></div><div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><div className={`${card} p-5`}><h3 className="mb-4 text-lg font-semibold">Influencer Credibility Score</h3><p className="mb-4 text-sm text-[#6B7280]">Credibility = (Ng + 0.5 × Ns) / N</p><div className="h-56"><ResponsiveContainer><BarChart data={[{ name: 'Credibility', value: Number((credibility * 100).toFixed(2)) }]}><CartesianGrid stroke="#E5E7EB" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="value" fill="#3B82F6" /></BarChart></ResponsiveContainer></div></div><div className={`${card} p-5`}><h3 className="mb-4 text-lg font-semibold">Classification Distribution</h3><div className="h-56"><ResponsiveContainer><PieChart><Pie data={[{ name: 'Genuine', value: stats.genuine }, { name: 'Suspicious', value: stats.suspicious }, { name: 'Bot', value: stats.bots }]} dataKey="value" outerRadius={86}>{['Genuine', 'Suspicious', 'Bot'].map((k) => <Cell key={k} fill={COLORS[k]} />)}</Pie><Legend /></PieChart></ResponsiveContainer></div></div></div></Fade>,
    audit: <Fade className="space-y-6"><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><StatCard label="Audited Accounts" value={stats.total} icon={Users} /><StatCard label="Flagged Accounts" value={stats.suspicious + stats.bots} icon={AlertTriangle} iconColor="text-[#92400E]" /><StatCard label="Report Snapshot" value="2026-04-01" icon={FileDown} /></div><div className={`${card} p-5`}><h3 className="mb-3 text-lg font-semibold">Confusion Matrix (Bot vs Non-Bot)</h3><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg border p-3">TP: {metrics.confusion.tp}</div><div className="rounded-lg border p-3">FP: {metrics.confusion.fp}</div><div className="rounded-lg border p-3">FN: {metrics.confusion.fn}</div><div className="rounded-lg border p-3">TN: {metrics.confusion.tn}</div></div></div></Fade>,
    algorithm: <Fade className="space-y-6"><div className={`${card} p-5`}><h3 className="text-lg font-semibold">Algorithm Overview</h3><p className="text-sm text-[#6B7280]">Data preprocessing → feature engineering → min-max normalization → entropy-based weighting → risk scoring and classification.</p><div className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm">ratio = followers / (following + 1)<br />engagement_ratio = (avg_likes + avg_comments) / (followers + 1)<br />activity_rate = total_posts / (account_age_days + 1)<br /><br />RiskScore = wp × ProfileScore + we × EngagementScore + wt × TemporalScore</div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[540px] border border-[#E5E7EB] text-sm"><thead className="bg-[#F9FAFB]"><tr><th className="border-b p-3 text-left">Component</th><th className="border-b p-3 text-left">Entropy Weight</th></tr></thead><tbody><tr><td className="border-b p-3">ProfileScore</td><td className="border-b p-3">{weights.profile.toFixed(4)}</td></tr><tr><td className="border-b p-3">EngagementScore</td><td className="border-b p-3">{weights.engagement.toFixed(4)}</td></tr><tr><td className="border-b p-3">TemporalScore</td><td className="border-b p-3">{weights.temporal.toFixed(4)}</td></tr></tbody></table></div><div className="mt-3 text-sm text-[#6B7280]">Thresholds: RiskScore &lt; 0.4 = Genuine, 0.4–0.7 = Suspicious, &gt; 0.7 = Bot.</div></div></Fade>,
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-[#111827]">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-[#E5E7EB] bg-white"><div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-4 lg:px-6"><div className="flex items-center gap-3"><button className="rounded-md p-2 lg:hidden" onClick={() => setMobileOpen((v) => !v)}><Menu size={18} /></button><div><h1 className="text-2xl font-bold">Fake Follower Detection & Credibility Dashboard</h1><p className="text-sm text-[#6B7280]">End-to-end ML pipeline visualization</p></div></div><button className="rounded-lg border border-[#E5E7EB] p-2"><Moon size={16} className="text-[#6B7280]" /></button></div></header>
      <div className="mx-auto flex max-w-[1600px] pt-20"><aside className={`fixed left-0 top-20 h-[calc(100vh-80px)] w-72 border-r border-[#E5E7EB] bg-white p-4 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}><nav className="space-y-1">{navItems.map((n) => { const Icon = n.icon; const isActive = active === n.key; return <button key={n.key} onClick={() => { setActive(n.key); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'text-[#374151] hover:bg-[#F9FAFB]'}`}><Icon size={16} />{n.label}</button>; })}</nav></aside><main className="w-full p-4 lg:ml-72 lg:p-6">{content[active]}</main></div>
    </div>
  );
}

export default App;
