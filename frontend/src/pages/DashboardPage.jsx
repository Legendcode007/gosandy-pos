import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { MdTrendingUp, MdReceiptLong, MdPending, MdCalendarToday, MdAdd } from 'react-icons/md';

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, isBoss, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gosandy border-t-transparent" />
    </div>
  );

  const statusColor = { PENDING: 'badge-pending', CONFIRMED: 'badge-confirmed', CANCELLED: 'badge-cancelled' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.fullName?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.branch ? `${user.branch.name} Branch` : 'All Branches'} • {new Date().toDateString()}
          </p>
        </div>
        <Link to="/transactions/new" className="btn-primary flex items-center gap-2">
          <MdAdd size={20} />
          <span className="hidden sm:inline">New Sale</span>
        </Link>
      </div>

      {/* Stats Grid */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Sales"
            value={formatCurrency(data.today.sales)}
            subtitle={`${data.today.transactions} transactions`}
            icon={MdCalendarToday}
            color="bg-blue-500"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(data.thisMonth.sales)}
            subtitle={`${data.thisMonth.transactions} transactions`}
            icon={MdTrendingUp}
            color="bg-gosandy"
          />
          <StatCard
            title="All-Time Sales"
            value={formatCurrency(data.allTime.sales)}
            subtitle={`${data.allTime.transactions} total`}
            icon={MdReceiptLong}
            color="bg-purple-500"
          />
          <StatCard
            title="Pending"
            value={data.pendingCount}
            subtitle="Awaiting confirmation"
            icon={MdPending}
            color="bg-amber-500"
          />
        </div>
      )}

      {/* Recent Transactions */}
      {data?.recentTransactions?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-gosandy hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-left">
                  <th className="pb-2 font-medium">Date</th>
                  {(isBoss() || isAdmin()) && <th className="pb-2 font-medium">Staff</th>}
                  {isBoss() && <th className="pb-2 font-medium">Branch</th>}
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-2.5 text-gray-600">{formatDateTime(tx.createdAt)}</td>
                    {(isBoss() || isAdmin()) && <td className="py-2.5">{tx.staff?.fullName}</td>}
                    {isBoss() && <td className="py-2.5 text-gray-500">{tx.branch?.name}</td>}
                    <td className="py-2.5 text-right font-medium">{formatCurrency(tx.totalAmount)}</td>
                    <td className="py-2.5 text-right">
                      <span className={statusColor[tx.status]}>{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data?.recentTransactions?.length === 0 && (
        <div className="card text-center py-12">
          <MdReceiptLong size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No transactions yet</p>
          <Link to="/transactions/new" className="btn-primary inline-flex items-center gap-2 mt-4">
            <MdAdd size={18} /> Record First Sale
          </Link>
        </div>
      )}
    </div>
  );
}
