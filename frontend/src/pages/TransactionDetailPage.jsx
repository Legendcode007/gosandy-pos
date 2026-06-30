import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdPrint, MdCheckCircle, MdCancel } from 'react-icons/md';

export default function TransactionDetailPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amountPaid, setAmountPaid] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchTransaction = () => {
    api.get(`/transactions/${id}`)
      .then(res => setTransaction(res.data.data))
      .catch(() => toast.error('Could not load transaction'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransaction(); }, [id]);

  const handleConfirm = async () => {
    if (!amountPaid || parseFloat(amountPaid) < parseFloat(transaction.totalAmount)) {
      return toast.error('Amount paid must be at least the total');
    }
    setConfirming(true);
    try {
      const { data } = await api.put(`/transactions/${id}/confirm`, { amountPaid: parseFloat(amountPaid) });
      toast.success(`Confirmed! Change: ${formatCurrency(data.data.balance)}`);
      fetchTransaction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not confirm');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this transaction?')) return;
    setCancelling(true);
    try {
      await api.put(`/transactions/${id}/cancel`);
      toast.success('Transaction cancelled');
      navigate('/transactions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.open(`/api/receipts/${id}/pdf`, '_blank');
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gosandy border-t-transparent" />
    </div>
  );

  if (!transaction) return <div className="text-center py-20 text-gray-400">Transaction not found</div>;

  const statusColor = { PENDING: 'badge-pending', CONFIRMED: 'badge-confirmed', CANCELLED: 'badge-cancelled' };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Transaction Detail</h1>
          <p className="text-sm text-gray-500">{formatDateTime(transaction.createdAt)}</p>
        </div>
        <span className={statusColor[transaction.status]}>{transaction.status}</span>
      </div>

      {/* Info */}
      <div className="card space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400">Branch</p>
            <p className="font-medium">{transaction.branch?.name}</p>
          </div>
          <div>
            <p className="text-gray-400">Recorded by</p>
            <p className="font-medium">{transaction.staff?.fullName}</p>
          </div>
          {transaction.customerName && (
            <div>
              <p className="text-gray-400">Customer</p>
              <p className="font-medium">{transaction.customerName}</p>
            </div>
          )}
          {transaction.cashier && (
            <div>
              <p className="text-gray-400">Cashier</p>
              <p className="font-medium">{transaction.cashier?.fullName}</p>
            </div>
          )}
          {transaction.confirmedAt && (
            <div>
              <p className="text-gray-400">Confirmed at</p>
              <p className="font-medium">{formatDateTime(transaction.confirmedAt)}</p>
            </div>
          )}
          {transaction.notes && (
            <div className="col-span-2">
              <p className="text-gray-400">Notes</p>
              <p className="font-medium">{transaction.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <h2 className="font-bold text-gray-800 mb-3">Items</h2>
        <div className="space-y-2">
          {transaction.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{item.itemName}</p>
                <p className="text-xs text-gray-400 capitalize">{item.itemType.toLowerCase()}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                <p className="text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-2 pt-3 border-t">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-gosandy">{formatCurrency(transaction.totalAmount)}</span>
          </div>
          {transaction.status === 'CONFIRMED' && (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Amount Paid</span>
                <span>{formatCurrency(transaction.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-green-600">
                <span>Change</span>
                <span>{formatCurrency(transaction.balance)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="card space-y-3">
        {/* Cashier confirm (ADMIN/BOSS on PENDING) */}
        {transaction.status === 'PENDING' && isAdmin() && (
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Confirm Payment</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Amount Received (₵)</label>
                <input
                  type="number"
                  className="input"
                  placeholder={`Min: ${parseFloat(transaction.totalAmount).toFixed(2)}`}
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  min={parseFloat(transaction.totalAmount)}
                  step="0.01"
                />
              </div>
              {amountPaid && parseFloat(amountPaid) >= parseFloat(transaction.totalAmount) && (
                <div className="self-end text-right">
                  <p className="text-xs text-gray-400">Change</p>
                  <p className="font-bold text-green-600 text-lg">
                    {formatCurrency(parseFloat(amountPaid) - parseFloat(transaction.totalAmount))}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full btn-primary mt-3 flex items-center justify-center gap-2"
            >
              <MdCheckCircle size={18} />
              {confirming ? 'Confirming...' : 'Confirm & Collect Payment'}
            </button>
          </div>
        )}

        {/* Print receipt */}
        {transaction.status === 'CONFIRMED' && (
          <button
            onClick={handlePrint}
            className="w-full btn-secondary flex items-center justify-center gap-2"
          >
            <MdPrint size={18} />
            Print Receipt
          </button>
        )}

        {/* Cancel */}
        {transaction.status === 'PENDING' && (
          transaction.staff?.id === user.id || isAdmin()
        ) && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full btn-danger flex items-center justify-center gap-2"
          >
            <MdCancel size={18} />
            {cancelling ? 'Cancelling...' : 'Cancel Transaction'}
          </button>
        )}
      </div>
    </div>
  );
}
