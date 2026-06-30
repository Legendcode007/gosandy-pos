import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/date';
import toast from 'react-hot-toast';
import { MdPeople, MdSearch, MdEdit, MdPersonOff, MdPersonAdd } from 'react-icons/md';

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

const roleBadge = {
  BOSS:  'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-green-100 text-green-700',
};

export default function UsersPage() {
  const { user: me, isBoss } = useAuth();
  const [users, setUsers]     = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState({ role: 'STAFF', branchId: '', isActive: true });
  const [saving, setSaving]   = useState(false);

  const fetchData = () => {
    Promise.all([
      api.get('/users'),
      api.get('/branches'),
    ]).then(([u, b]) => {
      setUsers(u.data.data);
      setBranches(b.data.data);
    }).catch(() => toast.error('Could not load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openAssign = (user) => {
    setSelected(user);
    setForm({ role: user.role, branchId: user.branch?.id || '', isActive: user.isActive });
    setModal('assign');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${selected.id}/assign`, {
        role: form.role,
        branchId: form.branchId || null,
        isActive: form.isActive,
      });
      toast.success('User updated successfully');
      setModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`Deactivate ${user.fullName}? They won't be able to log in.`)) return;
    try {
      await api.put(`/users/${user.id}/deactivate`);
      toast.success('User deactivated');
      fetchData();
    } catch (err) {
      toast.error('Could not deactivate user');
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Unassigned = registered but no branch yet
  const unassigned = filtered.filter(u => !u.branch && u.role === 'STAFF');
  const assigned   = filtered.filter(u => u.branch || u.role !== 'STAFF');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage staff accounts and permissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          className="input pl-10"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gosandy border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Unassigned Users Alert */}
          {unassigned.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <MdPersonAdd size={20} className="text-amber-600" />
                <p className="font-semibold text-amber-800">{unassigned.length} user(s) awaiting branch assignment</p>
              </div>
              <div className="space-y-2">
                {unassigned.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                    <div>
                      <p className="font-medium text-sm">{u.fullName}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <button onClick={() => openAssign(u)} className="btn-primary text-xs py-1.5 px-3">
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="card overflow-hidden p-0">
            <div className="px-5 py-4 border-b bg-gray-50">
              <p className="font-semibold text-gray-700">All Users ({assigned.length})</p>
            </div>
            {assigned.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MdPeople size={48} className="mx-auto mb-2 text-gray-200" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">Name</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">Branch</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">Role</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">Joined</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {assigned.map(u => (
                      <tr key={u.id} className={`hover:bg-gray-50 ${!u.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-3 font-medium">{u.fullName}</td>
                        <td className="px-5 py-3 text-gray-500">{u.email}</td>
                        <td className="px-5 py-3">{u.branch?.name || <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleBadge[u.role]}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{formatDateTime(u.createdAt)}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Can't edit yourself or someone with higher/equal role unless Boss */}
                            {(isBoss() || u.role === 'STAFF') && u.id !== me.id && (
                              <>
                                <button
                                  onClick={() => openAssign(u)}
                                  className="p-1.5 text-gosandy hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit user"
                                >
                                  <MdEdit size={16} />
                                </button>
                                {u.isActive && (
                                  <button
                                    onClick={() => handleDeactivate(u)}
                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Deactivate"
                                  >
                                    <MdPersonOff size={16} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Assign / Edit Modal */}
      {modal === 'assign' && selected && (
        <Modal title={`Edit: ${selected.fullName}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium">{selected.fullName}</p>
              <p className="text-gray-500">{selected.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
                {isBoss() && <option value="BOSS">Boss</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                className="input"
                value={form.branchId}
                onChange={e => setForm({ ...form, branchId: e.target.value })}
              >
                <option value="">— No branch assigned —</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-gosandy"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Account is active</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
