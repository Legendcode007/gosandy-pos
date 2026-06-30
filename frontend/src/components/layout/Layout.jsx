import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdPointOfSale, MdBusiness, MdPeople,
  MdMiscellaneousServices, MdInventory, MdBarChart,
  MdAccountCircle, MdLogout, MdMenu, MdClose,
  MdReceiptLong
} from 'react-icons/md';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard',        label: 'Dashboard',    icon: MdDashboard,            roles: ['BOSS','ADMIN','STAFF'] },
  { path: '/transactions/new', label: 'New Sale',      icon: MdPointOfSale,          roles: ['BOSS','ADMIN','STAFF'] },
  { path: '/transactions',     label: 'Transactions',  icon: MdReceiptLong,          roles: ['BOSS','ADMIN','STAFF'] },
  { path: '/branches',         label: 'Branches',      icon: MdBusiness,             roles: ['BOSS'] },
  { path: '/users',            label: 'Users',         icon: MdPeople,               roles: ['BOSS','ADMIN'] },
  { path: '/services',         label: 'Services',      icon: MdMiscellaneousServices,roles: ['BOSS','ADMIN'] },
  { path: '/stationery',       label: 'Stationery',    icon: MdInventory,            roles: ['BOSS','ADMIN'] },
  { path: '/reports',          label: 'Reports',       icon: MdBarChart,             roles: ['BOSS','ADMIN'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role));

  const roleBadgeColor = {
    BOSS: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-green-100 text-green-700',
  }[user?.role] || 'bg-gray-100 text-gray-700';

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gosandy text-white">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-gosandy font-black text-lg">G</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Gosandy</p>
            <p className="text-xs text-blue-200 leading-tight">Company Ltd</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/10">
        <p className="font-semibold text-sm truncate">{user?.fullName}</p>
        <p className="text-xs text-blue-200 truncate">{user?.email}</p>
        <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor}`}>
          {user?.role}
        </span>
        {user?.branch && (
          <p className="text-xs text-blue-300 mt-1">📍 {user.branch.name}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <NavLink
          to="/profile"
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <MdAccountCircle size={20} />
          My Profile
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-red-500/20 hover:text-red-200 transition-colors"
        >
          <MdLogout size={20} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 flex-shrink-0 shadow-lg">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-64 h-full shadow-xl">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden bg-gosandy text-white px-4 py-3 flex items-center gap-3 shadow">
          <button onClick={() => setSidebarOpen(true)}>
            <MdMenu size={24} />
          </button>
          <span className="font-bold text-sm">Gosandy Company Ltd</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
