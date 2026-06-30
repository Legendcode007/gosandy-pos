import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewTransactionPage from './pages/NewTransactionPage';
import TransactionsPage from './pages/TransactionsPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import BranchesPage from './pages/BranchesPage';
import UsersPage from './pages/UsersPage';
import ServicesPage from './pages/ServicesPage';
import StationeryPage from './pages/StationeryPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/layout/Layout';

// Protected route wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="transactions/new" element={<NewTransactionPage />} />
        <Route path="transactions/:id" element={<TransactionDetailPage />} />
        <Route path="branches" element={<ProtectedRoute roles={['BOSS']}><BranchesPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['BOSS','ADMIN']}><UsersPage /></ProtectedRoute>} />
        <Route path="services" element={<ProtectedRoute roles={['BOSS','ADMIN']}><ServicesPage /></ProtectedRoute>} />
        <Route path="stationery" element={<ProtectedRoute roles={['BOSS','ADMIN']}><StationeryPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['BOSS','ADMIN']}><ReportsPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', background: '#333', color: '#fff' },
            success: { style: { background: '#166534' } },
            error: { style: { background: '#991b1b' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
