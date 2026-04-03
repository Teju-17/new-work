import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Search, ShieldX, UploadCloud } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

const STATUS_COLORS = {
  'Genuine influencer': 'bg-emerald-100 text-emerald-700',
  'Fake influencer': 'bg-rose-100 text-rose-700',
};

const PIE_COLORS = ['#22C55E', '#F59E0B', '#EF4444'];

function SummaryCard({ label, value, Icon, tone = 'text-slate-800' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <Icon className={tone} size={20} />
      </div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const selected = useMemo(
    () => results.find((item) => item.insta_id === selectedId) ?? results[0],
    [results, selectedId],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return results;
    return results.filter(
      (item) =>
        item.influencer_name.toLowerCase().includes(q) ||
        item.insta_id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [results, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, item) => {
        acc.influencers += 1;
        acc.followers += item.total_followers;
        acc.genuine += item.genuine_count;
        acc.suspicious += item.suspicious_count;
        acc.bot += item.bot_count;
        return acc;
      },
      { influencers: 0, followers: 0, genuine: 0, suspicious: 0, bot: 0 },
    );
  }, [filtered]);

  const uploadAndAnalyze = async () => {
    if (!file) {
      setError('Please choose a CSV file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const info = await response.json().catch(() => ({}));
        throw new Error(info.detail || 'Failed to analyze CSV');
      }

      const payload = await response.json();
      setResults(payload);
      setSelectedId(payload[0]?.insta_id ?? null);
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!results.length) return;

    const headers = [
      'influencer_name',
      'category',
      'insta_id',
      'total_followers',
      'genuine_count',
      'suspicious_count',
      'bot_count',
      'credibility_score',
      'status',
    ];

    const lines = results.map((item) =>
      headers.map((h) => JSON.stringify(item[h] ?? '')).join(','),
    );

    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'influencer_audit_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const pieData =
    selected && selected.total_followers
      ? [
          { name: 'Genuine', value: selected.genuine_count },
          { name: 'Suspicious', value: selected.suspicious_count },
          { name: 'Bot', value: selected.bot_count },
        ]
      : [];

  const explainData =
    selected
      ? [
          {
            name: 'ProfileScore',
            value: Number((selected.profile_contribution * 100).toFixed(2)),
          },
          {
            name: 'EngagementScore',
            value: Number((selected.engagement_contribution * 100).toFixed(2)),
          },
          {
            name: 'TemporalScore',
            value: Number((selected.temporal_contribution * 100).toFixed(2)),
          },
        ]
      : [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Influencer Credibility Audit Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Upload grouped influencer-follower CSV data, detect fake followers, and audit credibility using entropy-weighted risk scoring.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
                <UploadCloud size={16} />
                <span>{file ? file.name : 'Choose CSV'}</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                onClick={uploadAndAnalyze}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Analyzing...
                  </span>
                ) : (
                  'Run Audit'
                )}
              </button>
              <button
                onClick={downloadReport}
                disabled={!results.length}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download Report CSV
              </button>
            </div>
            <div className="relative w-full lg:w-80">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                placeholder="Search influencer/category/insta_id"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Influencers" value={totals.influencers} Icon={CheckCircle2} tone="text-blue-600" />
          <SummaryCard label="Followers Audited" value={totals.followers.toLocaleString()} Icon={CheckCircle2} tone="text-emerald-600" />
          <SummaryCard label="Suspicious Followers" value={totals.suspicious.toLocaleString()} Icon={AlertTriangle} tone="text-amber-600" />
          <SummaryCard label="Bot Followers" value={totals.bot.toLocaleString()} Icon={ShieldX} tone="text-rose-600" />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
          <h2 className="mb-3 text-lg font-semibold">Audit Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-2">Influencer Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Insta ID</th>
                  <th className="px-3 py-2">Total Followers</th>
                  <th className="px-3 py-2">Genuine</th>
                  <th className="px-3 py-2">Suspicious</th>
                  <th className="px-3 py-2">Bot</th>
                  <th className="px-3 py-2">Credibility</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.insta_id}
                    onClick={() => setSelectedId(item.insta_id)}
                    className={`cursor-pointer border-b border-slate-100 ${selected?.insta_id === item.insta_id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-3 py-2 font-medium">{item.influencer_name}</td>
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2">{item.insta_id}</td>
                    <td className="px-3 py-2">{item.total_followers.toLocaleString()}</td>
                    <td className="px-3 py-2">{item.genuine_count.toLocaleString()}</td>
                    <td className="px-3 py-2">{item.suspicious_count.toLocaleString()}</td>
                    <td className="px-3 py-2">{item.bot_count.toLocaleString()}</td>
                    <td className="px-3 py-2">{(item.credibility_score * 100).toFixed(2)}%</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-slate-100 text-slate-700'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold">Credibility Gauge</h3>
              <div className="h-60">
                <ResponsiveContainer>
                  <RadialBarChart
                    innerRadius="65%"
                    outerRadius="95%"
                    barSize={18}
                    data={[{ name: 'credibility', value: selected.credibility_score * 100 }]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" fill="#2563EB" cornerRadius={9} background />
                    <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <p className="-mt-4 text-center text-2xl font-bold text-slate-900">{(selected.credibility_score * 100).toFixed(2)}%</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold">Follower Class Distribution</h3>
              <div className="h-60">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={85} label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold">Explainability Contributions</h3>
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={explainData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#0EA5E9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {selected && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
            <h3 className="text-lg font-semibold">Explainability Summary</h3>
            <p className="mt-2 text-sm text-slate-600">
              Credibility is computed as <strong>(Ng + 0.5 × Ns) / N</strong> and status is determined from follower risk composition.
            </p>
            <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
              {(selected.reasons ?? []).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
