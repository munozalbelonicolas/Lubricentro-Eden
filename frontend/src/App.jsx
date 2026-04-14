import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import YorChat from './components/chat/YorChat';
import ErrorBoundary from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';

// ── Eager load: páginas públicas que deben cargar rápido ──
import HomePage    from './pages/HomePage';
import StorePage   from './pages/StorePage';
import ProductPage from './pages/ProductPage';

// ── Lazy load: páginas que no necesitan cargarse al inicio ──
const CartPage        = lazy(() => import('./pages/CartPage'));
const CheckoutPage    = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage      = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const LoginPage       = lazy(() => import('./pages/LoginPage'));
const RegisterPage    = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const BudgetPage      = lazy(() => import('./pages/BudgetPage'));
const NotFoundPage    = lazy(() => import('./pages/NotFoundPage'));

// ── Lazy load: dashboard admin (bundle pesado con recharts, etc.) ──
const DashboardPage  = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProductsAdmin  = lazy(() => import('./pages/dashboard/ProductsAdmin'));
const OrdersAdmin    = lazy(() => import('./pages/dashboard/OrdersAdmin'));
const WorkshopAdmin  = lazy(() => import('./pages/dashboard/WorkshopAdmin'));
const VehicleHistory = lazy(() => import('./pages/dashboard/VehicleHistory'));
const FinancePage    = lazy(() => import('./pages/dashboard/FinancePage'));
const UsersAdmin     = lazy(() => import('./pages/dashboard/UsersAdmin'));
const StatsPage      = lazy(() => import('./pages/dashboard/StatsPage'));

// ── Rutas protegidas ──
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <LazyNavigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <LazyNavigate to="/login" />;
  if (user.role !== 'admin') return <LazyNavigate to="/" />;
  return children;
};

// Helper para Navigate sin importar estáticamente
import { Navigate } from 'react-router-dom';
const LazyNavigate = ({ to }) => <Navigate to={to} replace />;

const PageLoader = () => (
  <div className="flex-center" style={{ minHeight: '60vh' }}>
    <div className="spinner" />
  </div>
);

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <YorChat />
    </>
  );
}
