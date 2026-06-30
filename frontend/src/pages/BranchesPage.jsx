import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdBusiness, MdLocationOn, MdPhone, MdPeople, MdReceiptLong } from 'react-icons/md';

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

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const fetchBranches = () => {
    api.get('/branches')
      .then(res => setBranches(res.data.data))
      .catch(() => toast.error('Could not load branches'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBranches(); }, []);

  const openCreate = () => {
    setForm({ name: '', location: '', phone: '' });
    setEditing(null);
    setModal('form');
  };

  const openEdit = (branch) => {
    setForm({ name: branch.name, location: branch.location, phone: branch.phone || '' });
    setEditing(branch);
    setModal('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.location) return toast.error('Name and location are required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/branches/${editing.id}`, form);
        toast.success('Branch updated');
      } else {
        await api.post('/branches', form);
        toast.success('Branch created');
      }
      setModal(null);
      fetchBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (branch) => {
    if (!window.confirm(`Deactivate "${branch.name}"? This will hide it from the system.`)) return;
    try {
      await api.delete(`/branches/${branch.id}`);
      toast.success('Branch deactivated');
      fetchBranches();
    } catch (err) {
      toast.error('Could not deactivate branch');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Branches</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all Gosandy Company Ltd branches</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <MdAdd size={20} /> New Branch
        </button>
      </div>

      {/* Branch Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gosandy border-t-transparent" />
        </div>
      ) : branches.length === 0 ? (
        <div className="card text-center py-16">
          <MdBusiness size={56} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 text-lg font-medium">No branches yet</p>
          <p className="text-gray-400 text-sm mb-6">Create your first branch to get started</p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <MdAdd size={18} /> Create First Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => (
            <div key={branch.id} className="card hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gosandy rounded-xl flex items-center justify-center">
                    <MdBusiness size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{branch.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MdLocationOn size={16} className="text-gray-400 flex-shrink-0" />
                  <span>{branch.location}</span>
                </div>
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <MdPhone size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t flex gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MdPeople size={16} />
                  <span>{branch._count?.users || 0} staff</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MdReceiptLong size={16} />
                  <span>{branch._count?.transactions || 0} transactions</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(branch)}
                  className="flex-1 btn-secondary text-sm py-1.5 flex items-center justify-center gap-1"
                >
                  <MdEdit size={16} /> Edit
                </button>
                {branch.isActive && (
                  <button
                    onClick={() => handleDeactivate(branch)}
                    className="flex-1 border border-red-300 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal === 'form' && (
        <Modal title={editing ? 'Edit Branch' : 'New Branch'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
              <input
                className="input"
                placeholder="e.g. Accra Main, Kumasi Branch"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                className="input"
                placeholder="e.g. Osu, Accra"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                className="input"
                placeholder="e.g. 030XXXXXXX"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Branch'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
