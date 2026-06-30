import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { MdBarChart, MdTrendingUp, MdPeople, MdBusiness } from 'react-icons/md';

const COLORS = ['#1a5276', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#e74c3c'];

const today = new Date();
const formatInput = (d) => d.toISOString().split('T')[0];

export default function ReportsPage() {
  const { isBoss, user } = useAuth();

  const [tab, setTab] = useState(isBoss() ? 'overview' : 'branch');
  const [startDate, setStartDate] = useState(formatInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [endDate, setEndDate] = useState(formatInput(today));

  const [overview, setOverview] = useState(null);
  const [branchReport, setBranchReport] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(false);

  // Load branches for selector (Boss only)
  useEffect(() => {
    if (isBoss()) {
      api.get('/branches').then(res => {
        setBranches(res.data.data);
        if (res.data.data.length > 0) setSelectedBranch(res.data.data[0].id);
      });
    } else {
      setSelectedBranch(user.branchId);
    }
  }, []);

  const fetchOverview = () => {
    if (!isBoss()) return;
    setLoading(true);
    api.get('/reports/overview', { params: { startDate, endDate } })
      .then(res => setOverview(res.data.data))
      .catch(() => toast.error('Could not load overview'))
      .finally(() => setLoading(false));
  };

  const fetchBranchReport = () => {
    if (!selectedBranch) return;
    setLoading(true);
    api.get(`/reports/branch/${selectedBranch}`, { params: { startDate, endDate } })
      .then(res => setBranchReport(res.data.data))
      .catch(() => toast.error('Could not load branch report'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'overview') fetchOverview();
    if (tab === 'branch' && selectedBranch) fetchBranchReport();
  }, [tab, startDate, endDate, selectedBranch]);

  const tabs = [
    ...(isBoss() ? [{ key: 'overview', label: 'All Branches', icon: MdBusiness }] : []),
    { key: 'branch', label: 'Branch Report', icon: MdBarChart },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Sales performance and business insights</p>
      </div>

      {/* Date Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" className="input text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" className="input text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          {/* Quick range buttons */}
          <div className="flex gap-2">
            {[
              { label: 'Today', fn: () => { const d = formatInput(today); setStartDate(d); setEndDate(d); } },
              { label: 'This Month', fn: () => { setStartDate(formatInput(new Date(today.getFullYear(), today.getMonth(), 1))); setEndDate(formatInput(today)); } },
              { label: 'This Year', fn: () => { setStartDate(formatInput(new Date(today.getFullYear(), 0, 1))); setEndDate(formatInput(today)); } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn} className="text-xs px-3 py-2 bg-gray-100 hover:bg-gosandy hover:text-white rounded-lg transition-colors whitespace-nowrap">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-gosandy text-gosandy' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gosandy border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ── All Branches Overview (Boss) ── */}
          {tab === 'overview' && overview && (
            <div className="space-y-6">
              {/* Overall KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card bg-gosandy text-white">
                  <p className="text-blue-200 text-sm">Total Revenue</p>
                  <p className="text-4xl font-black mt-1">{formatCurrency(overview.overall.totalSales)}</p>
                  <p className="text-blue-300 text-sm mt-1">{overview.overall.totalTransactions} transactions</p>
                </div>
                <div className="card border-2 border-gosandy">
                  <p className="text-gray-500 text-sm">Active Branches</p>
                  <p className="text-4xl font-black text-gosandy mt-1">{overview.branches.length}</p>
                  <p className="text-gray-400 text-sm mt-1">Contributing to revenue</p>
                </div>
              </div>

              {/* Branch Comparison Bar Chart */}
              {overview.branches.length > 0 && (
                <div className="card">
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MdBusiness size={18} className="text-gosandy" /> Branch Performance Comparison
                  </h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={overview.branches} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="branchName" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={v => `₵${v}`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Bar dataKey="totalSales" fill="#1a5276" radius={[6, 6, 0, 0]} name="Total Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Branch Table */}
              <div className="card">
                <h2 className="font-bold text-gray-800 mb-4">Branch Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 text-gray-500 font-medium">Branch</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Location</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Transactions</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Total Sales</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {overview.branches.map((b, i) => (
                        <tr key={b.branchId} className="hover:bg-gray-50">
                          <td className="py-2.5 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            {b.branchName}
                          </td>
                          <td className="py-2.5 text-gray-400">{b.location}</td>
                          <td className="py-2.5 text-right">{b.transactions}</td>
                          <td className="py-2.5 text-right font-bold text-gosandy">{formatCurrency(b.totalSales)}</td>
                          <td className="py-2.5 text-right text-gray-400">
                            {overview.overall.totalSales > 0
                              ? `${((b.totalSales / overview.overall.totalSales) * 100).toFixed(1)}%`
                              : '0%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Branch Report ── */}
          {tab === 'branch' && (
            <div className="space-y-6">
              {/* Branch selector (Boss only) */}
              {isBoss() && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Branch:</label>
                  <select className="input max-w-xs text-sm" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.location}</option>)}
                  </select>
                </div>
              )}

              {branchReport && (
                <>
                  {/* KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="card bg-gosandy text-white">
                      <p className="text-blue-200 text-sm">Branch Revenue</p>
                      <p className="text-4xl font-black mt-1">{formatCurrency(branchReport.summary.totalSales)}</p>
                      <p className="text-blue-300 text-sm mt-1">{branchReport.summary.totalTransactions} transactions</p>
                    </div>
                    <div className="card">
                      <p className="text-gray-500 text-sm">Avg. Transaction</p>
                      <p className="text-4xl font-black text-gosandy mt-1">
                        {branchReport.summary.totalTransactions > 0
                          ? formatCurrency(branchReport.summary.totalSales / branchReport.summary.totalTransactions)
                          : '₵0.00'}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">Per confirmed sale</p>
                    </div>
                  </div>

                  {/* Sales breakdown by type */}
                  {branchReport.serviceBreakdown.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card">
                        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <MdBarChart size={18} className="text-gosandy" /> Sales by Type
                        </h2>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={branchReport.serviceBreakdown.map(s => ({ name: s.type, value: s.totalSales }))}
                              dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {branchReport.serviceBreakdown.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={v => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-2">
                          {branchReport.serviceBreakdown.map((s, i) => (
                            <div key={s.type} className="flex justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                {s.type}
                              </span>
                              <span className="font-bold">{formatCurrency(s.totalSales)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Staff */}
                      <div className="card">
                        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <MdPeople size={18} className="text-gosandy" /> Top Performing Staff
                        </h2>
                        {branchReport.topStaff.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
                        ) : (
                          <div className="space-y-3">
                            {branchReport.topStaff.map((staff, i) => {
                              const maxSales = branchReport.topStaff[0].totalSales;
                              const pct = maxSales > 0 ? (staff.totalSales / maxSales) * 100 : 0;
                              return (
                                <div key={staff.staffId}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium flex items-center gap-1.5">
                                      {i === 0 && <span>🥇</span>}
                                      {i === 1 && <span>🥈</span>}
                                      {i === 2 && <span>🥉</span>}
                                      {staff.staffName}
                                    </span>
                                    <span className="text-gosandy font-bold">{formatCurrency(staff.totalSales)}</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-gosandy h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">{staff.transactions} transactions</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {branchReport.summary.totalTransactions === 0 && (
                    <div className="card text-center py-12 text-gray-400">
                      <MdTrendingUp size={48} className="mx-auto mb-2 text-gray-200" />
                      <p>No confirmed transactions in this period</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
