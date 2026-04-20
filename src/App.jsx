import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './store/AppContext';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PartiesPage from './pages/PartiesPage';
import ItemsPage from './pages/ItemsPage';
import SalePage from './pages/SalePage';
import PurchasePage from './pages/PurchasePage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="parties" element={<PartiesPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="sale" element={<SalePage />} />
        <Route path="sale/*" element={<SalePage />} />
        <Route path="purchase" element={<PurchasePage />} />
        <Route path="purchase/*" element={<PurchasePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
