import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdMiscellaneousServices } from 'react-icons/md';

const CATEGORIES = ['Printing', 'Photocopying', 'Lamination', 'Book Binding', 'Scanning', 'Typing', 'Editing', 'Other'];

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

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Printing', unitPrice: '', description: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchServices = () => {
    api.get('/services')
      .then(res => setServices(res.data.data))
      .catch(() => toast.error('Could not load services'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => {
    setForm({ name: '', category: 'Printing', unitPrice: '', description: '', isActive: true });
    setEditing(null);
    setModal(true);
  };

  const openEdit = (svc) => {
    setForm({ name: svc.name, category: svc.category, unitPrice: svc.unitPrice, description: svc.description || '', isActive: svc.isActive });
    setEditing(svc);
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.unitPrice) return toast.error('Name and price are required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/services/${editing.id}`, form);
        toast.success('Service updated');
      } else {
        await api.post('/services', form);
        toast.success('Service created');
      }
      setModal(false);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save service');
    } finally {
      setSaving(false);
    }
  };

  // Group by category
  const byCategory = services.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Services</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the service catalog and pricing</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <MdAdd size={20} /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gosandy border-t-transparent" />
        </div>
      ) : services.length === 0 ? (
        <div className="card text-center py-16">
          <MdMiscellaneousServices size={56} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 mb-4">No services yet</p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <MdAdd size={18} /> Add First Service
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category} className="card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-6 bg-gosandy rounded-full" />
                <h2 className="font-bold text-gray-800">{category}</h2>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 text-gray-500 font-medium">Service Name</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Description</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Unit Price</th>
                      <th className="text-center py-2 text-gray-500 font-medium">Status</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map(svc => (
                      <tr key={svc.id} className={`hover:bg-gray-50 ${!svc.isActive ? 'opacity-50' : ''}`}>
                        <td className="py-2.5 font-medium">{svc.name}</td>
                        <td className="py-2.5 text-gray-400">{svc.description || '—'}</td>
                        <td className="py-2.5 text-right font-bold text-gosandy">{formatCurrency(svc.unitPrice)}</td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${svc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {svc.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => openEdit(svc)} className="text-gosandy hover:text-gosandy-dark p-1">
                            <MdEdit size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Service' : 'New Service'} onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
              <input className="input" placeholder="e.g. A4 Color Print" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₵) *</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input className="input" placeholder="e.g. Per page" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="svcActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-gosandy" />
                <label htmlFor="svcActive" className="text-sm font-medium text-gray-700">Service is active</label>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Service'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
