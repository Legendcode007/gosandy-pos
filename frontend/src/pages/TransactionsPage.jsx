import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { MdSearch, MdAdd, MdFilterList } from 'react-icons/md';

export default function TransactionsPage() {
  const { isBoss, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchTransactions = (page = 1) => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    api.get('/transactions', { params })
      .then(res => {
        setTransactions(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, [statusFilter]);

  const statusColor = {
    PENDING: 'badge-pending',
    CONFIRMED: 'badge-confirmed',
    CANCELLED: 'badge-cancelled',
  };

  const filtered = transactions.filter(tx =>
    !search ||
    tx.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    tx.staff?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <Link to="/transactions/new" className="btn-primary flex items-center gap-2">
          <MdAdd size={18} /> New Sale
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="input pl-9 text-sm"
              placeholder="Search by customer or staff..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input text-sm w-full sm:w-40"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gosandy border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Date & Time</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Customer</th>
                  {(isBoss() || isAdmin()) && <th className="text-left px-4 py-3 text-gray-500 font-medium">Staff</th>}
                  {isBoss() && <th className="text-left px-4 py-3 text-gray-500 font-medium">Branch</th>}
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Total</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                    <td className="px-4 py-3">{tx.customerName || <span className="text-gray-300">—</span>}</td>
                    {(isBoss() || isAdmin()) && <td className="px-4 py-3">{tx.staff?.fullName}</td>}
                    {isBoss() && <td className="px-4 py-3 text-gray-500">{tx.branch?.name}</td>}
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(tx.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={statusColor[tx.status]}>{tx.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/transactions/${tx.id}`} className="text-gosandy text-xs hover:underline font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <span className="text-gray-500">Total: {pagination.total}</span>
            <div className="flex gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchTransactions(page)}
                  className={`w-8 h-8 rounded ${page === pagination.page ? 'bg-gosandy text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
