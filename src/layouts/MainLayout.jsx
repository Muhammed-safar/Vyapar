import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useApp } from '../store/AppContext';

export default function MainLayout() {
  const { sidebarCollapsed, loading, error } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
      >
        <Navbar />
        <main className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
              ⚠️ {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Loading data...</p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
