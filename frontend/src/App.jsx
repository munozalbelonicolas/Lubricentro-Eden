import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import YorChat from './components/chat/YorChat';

import HomePage        from './pages/HomePage';
import StorePage       from './pages/StorePage';
import ProductPage     from './pages/ProductPage';
import CartPage        from './pages/CartPage';
import CheckoutPage    from './pages/CheckoutPage';
import OrdersPage      from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';

import DashboardPage   from './pages/dashboard/DashboardPage';
import ProductsAdmin   from './pages/dashboard/ProductsAdmin';
import OrdersAdmin     from './pages/dashboard/OrdersAdmin';
import WorkshopAdmin   from './pages/dashboard/WorkshopAdmin';
import VehicleHistory  from './pages/dashboard/VehicleHistory';
import FinancePage     from './pages/dashboard/FinancePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import UsersAdmin      from './pages/dashboard/UsersAdmin';
import StatsPage       from './pages/dashboard/StatsPage';
import BudgetPage      from './pages/BudgetPage';

// Rutas protegidas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-center" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-center" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Públicas */}
          <Route path="/"            element={<HomePage />} />
          <Route path="/store"       element={<StorePage />} />
          <Route path="/store/:slug" element={<ProductPage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/presupuesto"  element={<BudgetPage />} />

          {/* Usuario autenticado */}
          <Route path="/cart"     element={<PrivateRoute><CartPage /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/orders"   element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />

          {/* Admin dashboard */}
          <Route path="/dashboard"              element={<AdminRoute><DashboardPage /></AdminRoute>} />
          <Route path="/dashboard/products"     element={<AdminRoute><ProductsAdmin /></AdminRoute>} />
          <Route path="/dashboard/orders"       element={<AdminRoute><OrdersAdmin /></AdminRoute>} />
          <Route path="/dashboard/workshop"     element={<AdminRoute><WorkshopAdmin /></AdminRoute>} />
          <Route path="/dashboard/history"      element={<AdminRoute><VehicleHistory /></AdminRoute>} />
          <Route path="/dashboard/finance"      element={<AdminRoute><FinancePage /></AdminRoute>} />
          <Route path="/dashboard/users"        element={<AdminRoute><UsersAdmin /></AdminRoute>} />
          <Route path="/dashboard/stats"        element={<AdminRoute><StatsPage /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <YorChat />
    </>
  );
}
