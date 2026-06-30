import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdInventory, MdWarning, MdAddCircle } from 'react-icons/md';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between p-5 border-b">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export default function StationeryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'stock'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', unitPrice: '', quantityInStock: '', lowStockAlert: '5', isActive: true });
  const [stockForm, setStockForm] = useState({ quantity: '', note: '' });
  const [saving, setSaving] = useState(false);

  const fetchItems = () => {
    api.get('/stationery')
      .then(res => setItems(res.data.data))
      .catch(() => toast.error('Could not load stationery'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setForm({ name: '', unitPrice: '', quantityInStock: '', lowStockAlert: '5', isActive: true });
    setSelected(null);
    setModal('form');
  };

  const openEdit = (item) => {
    setForm({ name: item.name, unitPrice: item.unitPrice, quantityInStock: item.quantityInStock, lowStockAlert: item.lowStockAlert, isActive: item.isActive });
    setSelected(item);
    setModal('form');
  };

  const openStock = (item) => {
    setSelected(item);
    setStockForm({ quantity: '', note: '' });
    setModal('stock');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.unitPrice) return toast.error('Name and price are required');
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/stationery/${selected.id}`, form);
        toast.success('Item updated');
      } else {
        await api.post('/stationery', form);
        toast.success('Item created');
      }
      setModal(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save item');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!stockForm.quantity || parseInt(stockForm.quantity) < 1) return toast.error('Enter a valid quantity');
    setSaving(true);
    try {
      await api.post(`/stationery/${selected.id}/stock`, stockForm);
      toast.success(`Added ${stockForm.quantity} units to stock`);
      setModal(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update stock');
    } finally {
      setSaving(false);
    }
  };

  const lowStock = items.filter(i => i.quantityInStock <= i.lowStockAlert && i.quantityInStock > 0);
  const outOfStock = items.filter(i => i.quantityInStock === 0);

  const stockLevel = (item) => {
    if (item.quantityInStock === 0) return { label: 'Out of stock', color: 'bg-red-100 text-red-700' };
    if (item.quantityInStock <= item.lowStockAlert) return { label: 'Low stock', color: 'bg-amber-100 text-amber-700' };
    return { label: 'In stock', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stationery Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage stationery stock levels</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <MdAdd size={20} /> Add Item
        </button>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="space-y-2">
          {outOfStock.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <MdWarning size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                {outOfStock.length} item(s) out of stock: {outOfStock.map(i => i.name).join(', ')}
              </p>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <MdWarning size={20} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 font-medium">
                {lowStock.length} item(s) running low: {lowStock.map(i => `${i.name} (${i.quantityInStock})`).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gosandy border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <MdInventory size={56} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 mb-4">No stationery items yet</p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <MdAdd size={18} /> Add First Item
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Item Name</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Unit Price</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">In Stock</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Alert At</th>
                  <th className="text-center px-5 py-3 text-gray-500 font-medium">Level</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => {
                  const stock = stockLevel(item);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.isActive ? 'opacity-40' : ''}`}>
                      <td className="px-5 py-3 font-medium">{item.name}</td>
                      <td className="px-5 py-3 text-right text-gosandy font-bold">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-5 py-3 text-right font-bold text-lg">{item.quantityInStock}</td>
                      <td className="px-5 py-3 text-right text-gray-400">{item.lowStockAlert}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stock.color}`}>
                          {stock.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openStock(item)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Add stock"
                          >
                            <MdAddCircle size={18} />
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-gosandy hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit item"
                          >
                            <MdEdit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          <div className="px-5 py-3 bg-gray-50 border-t flex gap-6 text-sm text-gray-500">
            <span>{items.length} items total</span>
            <span className="text-green-600">{items.filter(i => i.quantityInStock > i.lowStockAlert).length} in stock</span>
            <span className="text-amber-600">{lowStock.length} low</span>
            <span className="text-red-600">{outOfStock.length} out</span>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal === 'form' && (
        <Modal title={selected ? 'Edit Item' : 'New Stationery Item'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input className="input" placeholder="e.g. Bic Pen, Exercise Book" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₵) *</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required />
            </div>
            {!selected && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock</label>
                <input type="number" min="0" className="input" placeholder="0" value={form.quantityInStock} onChange={e => setForm({ ...form, quantityInStock: e.target.value })} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Threshold</label>
              <input type="number" min="1" className="input" placeholder="5" value={form.lowStockAlert} onChange={e => setForm({ ...form, lowStockAlert: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1">Alert shows when stock falls below this number</p>
            </div>
            {selected && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="itemActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-gosandy" />
                <label htmlFor="itemActive" className="text-sm font-medium text-gray-700">Item is active</label>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Saving...' : selected ? 'Save Changes' : 'Add Item'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Stock Modal */}
      {modal === 'stock' && selected && (
        <Modal title={`Add Stock: ${selected.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Current stock</span>
                <span className="font-bold">{selected.quantityInStock} units</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
              <input
                type="number" min="1" className="input" placeholder="e.g. 50"
                value={stockForm.quantity}
                onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })}
                required
              />
              {stockForm.quantity && (
                <p className="text-xs text-green-600 mt-1">
                  New total: {selected.quantityInStock + parseInt(stockForm.quantity || 0)} units
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input className="input" placeholder="e.g. Purchase from supplier" value={stockForm.note} onChange={e => setStockForm({ ...stockForm, note: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Adding...' : 'Add Stock'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
