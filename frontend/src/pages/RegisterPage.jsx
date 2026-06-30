import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { fullName: form.fullName, email: form.email, phone: form.phone, password: form.password });
      toast.success('Account created! An admin will assign your branch.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gosandy to-gosandy-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-gosandy font-black text-4xl">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Gosandy Company Ltd</h1>
          <p className="text-blue-200 text-sm mt-1">Create your staff account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'e.g. Kwame Asante' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Phone (optional)', key: 'phone', type: 'tel', placeholder: '024XXXXXXX' },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
              { label: 'Confirm Password', key: 'confirmPassword', type: 'password', placeholder: 'Repeat password' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type} className="input" placeholder={placeholder}
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  required={key !== 'phone'}
                />
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gosandy font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
