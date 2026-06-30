import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDateTime } from '../utils/date';
import toast from 'react-hot-toast';
import { MdAccountCircle, MdLock, MdBusiness, MdEmail, MdPhone, MdBadge } from 'react-icons/md';

const roleBadge = {
  BOSS:  'bg-purple-100 text-purple-700 border border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-700 border border-blue-200',
  STAFF: 'bg-green-100 text-green-700 border border-green-200',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPw(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {/* Profile Card */}
      <div className="card">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 rounded-2xl bg-gosandy flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-2xl">
              {user?.fullName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user?.fullName}</h2>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${roleBadge[user?.role]}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MdEmail size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>

          {user?.phone && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MdPhone size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Phone</p>
                <p className="font-medium">{user?.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MdBusiness size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Branch</p>
              <p className="font-medium">{user?.branch?.name || 'Not assigned'}</p>
              {user?.branch?.location && <p className="text-xs text-gray-400">{user.branch.location}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MdBadge size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Member since</p>
              <p className="font-medium">{formatDateTime(user?.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MdLock size={20} className="text-gosandy" />
            <h2 className="font-bold text-gray-800">Change Password</h2>
          </div>
          <button
            onClick={() => setShowPw(!showPw)}
            className="text-sm text-gosandy hover:underline"
          >
            {showPw ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showPw && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password" className="input"
                placeholder="Your current password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password" className="input"
                placeholder="At least 6 characters"
                value={pwForm.newPassword}
                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password" className="input"
                placeholder="Repeat new password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={saving} className="w-full btn-primary">
              {saving ? 'Changing...' : 'Update Password'}
            </button>
          </form>
        )}

        {!showPw && (
          <p className="text-sm text-gray-400">Click "Change" to update your password.</p>
        )}
      </div>

      {/* System info */}
      <div className="text-center text-xs text-gray-300 pb-4">
        Gosandy Company Ltd — Business Management System v1.0
      </div>
    </div>
  );
}
