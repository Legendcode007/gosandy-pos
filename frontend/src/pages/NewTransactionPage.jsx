import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import { MdAdd, MdRemove, MdDelete, MdSearch } from 'react-icons/md';

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [stationery, setStationery] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get('/services'), api.get('/stationery')])
      .then(([svc, stat]) => {
        setServices(svc.data.data);
        setStationery(stat.data.data);
      })
      .catch(() => toast.error('Could not load catalog'))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (item, type) => {
    const existing = cart.find(c => c.itemId === item.id && c.itemType === type);
    if (existing) {
      setCart(cart.map(c =>
        c.itemId === item.id && c.itemType === type
          ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.unitPrice }
          : c
      ));
    } else {
      setCart([...cart, {
        itemId: item.id,
        itemType: type,
        itemName: item.name,
        unitPrice: parseFloat(item.unitPrice),
        quantity: 1,
        subtotal: parseFloat(item.unitPrice),
        maxStock: type === 'STATIONERY' ? item.quantityInStock : null,
      }]);
    }
  };

  const updateQty = (itemId, itemType, delta) => {
    setCart(cart.map(c => {
      if (c.itemId !== itemId || c.itemType !== itemType) return c;
      const newQty = c.quantity + delta;
      if (newQty < 1) return c;
      if (c.maxStock !== null && newQty > c.maxStock) {
        toast.error(`Only ${c.maxStock} in stock`);
        return c;
      }
      return { ...c, quantity: newQty, subtotal: newQty * c.unitPrice };
    }));
  };

  const removeFromCart = (itemId, itemType) => {
    setCart(cart.filter(c => !(c.itemId === itemId && c.itemType === itemType)));
  };

  const total = cart.reduce((sum, c) => sum + c.subtotal, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return toast.error('Add at least one item');
    setSubmitting(true);
    try {
      const { data } = await api.post('/transactions', {
        customerName: customerName || undefined,
        notes: notes || undefined,
        items: cart.map(c => ({ itemType: c.itemType, itemId: c.itemId, quantity: c.quantity })),
      });
      toast.success('Transaction recorded! Awaiting cashier confirmation.');
      navigate(`/transactions/${data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredStationery = stationery.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group services by category
  const servicesByCategory = filteredServices.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">New Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Catalog Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              className="input pl-10"
              placeholder="Search services or items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {['services', 'stationery'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-gosandy text-gosandy'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gosandy border-t-transparent" />
            </div>
          ) : activeTab === 'services' ? (
            <div className="space-y-4">
              {Object.entries(servicesByCategory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{category}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map(svc => (
                      <button
                        key={svc.id}
                        onClick={() => addToCart(svc, 'SERVICE')}
                        className="text-left p-3 rounded-lg border border-gray-200 hover:border-gosandy hover:bg-blue-50 transition-all group"
                      >
                        <p className="font-medium text-gray-800 text-sm group-hover:text-gosandy">{svc.name}</p>
                        <p className="text-gosandy font-bold mt-1">{formatCurrency(svc.unitPrice)}</p>
                        {svc.description && <p className="text-xs text-gray-400">{svc.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredServices.length === 0 && (
                <p className="text-center text-gray-400 py-8">No services found</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredStationery.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item, 'STATIONERY')}
                  disabled={item.quantityInStock === 0}
                  className="text-left p-3 rounded-lg border border-gray-200 hover:border-gosandy hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="font-medium text-gray-800 text-sm group-hover:text-gosandy">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gosandy font-bold">{formatCurrency(item.unitPrice)}</p>
                    <p className="text-xs text-gray-400">Stock: {item.quantityInStock}</p>
                  </div>
                  {item.quantityInStock === 0 && <p className="text-xs text-red-500 mt-1">Out of stock</p>}
                </button>
              ))}
              {filteredStationery.length === 0 && (
                <p className="col-span-2 text-center text-gray-400 py-8">No stationery found</p>
              )}
            </div>
          )}
        </div>

        {/* Cart Panel */}
        <div className="card h-fit sticky top-4 space-y-4">
          <h2 className="font-bold text-gray-800 text-lg">Cart</h2>

          {/* Customer name */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Customer Name (optional)</label>
            <input
              className="input text-sm"
              placeholder="e.g. Ama Owusu"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>

          {/* Cart items */}
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🛒</p>
              <p className="text-sm">Select items from the catalog</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {cart.map(item => (
                <div key={`${item.itemType}-${item.itemId}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.itemName}</p>
                    <p className="text-xs text-gosandy">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.itemId, item.itemType, -1)}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <MdRemove size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.itemId, item.itemType, 1)}
                      className="w-6 h-6 rounded-full bg-gosandy text-white flex items-center justify-center hover:bg-gosandy-dark"
                    >
                      <MdAdd size={14} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{formatCurrency(item.subtotal)}</p>
                    <button
                      onClick={() => removeFromCart(item.itemId, item.itemType)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <MdDelete size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {cart.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
              <textarea
                className="input text-sm"
                rows={2}
                placeholder="Any special notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          )}

          {/* Total & Submit */}
          {cart.length > 0 && (
            <>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Total</span>
                  <span className="text-2xl font-black text-gosandy">{formatCurrency(total)}</span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full btn-primary py-3 text-base"
              >
                {submitting ? 'Saving...' : 'Record Sale'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
