import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlus, HiMoon, HiSun, HiLogout, HiBell } from 'react-icons/hi';
import { useApp } from '../store/AppContext';
import { motion } from 'framer-motion';
import { updateSettings } from '../services/api';

export default function Navbar() {
  const { businessName, dispatch, darkMode, logout, sidebarCollapsed } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(businessName || '');

  const handleNameChange = async (e) => {
    const newName = e.target.value;
    setName(newName);
    dispatch({ type: 'SET_BUSINESS_NAME', payload: newName });
    try {
      await updateSettings({ businessName: newName });
    } catch (err) {
      console.error('Failed to sync business name');
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-3 flex items-center justify-between sticky top-0 z-40"
      style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
    >
      {/* Business Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-danger-500 animate-pulse-soft" />
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter Business Name"
            className="text-lg font-semibold text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none placeholder:text-gray-400 w-64"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? <HiSun size={20} /> : <HiMoon size={20} />}
        </button>

        <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors relative">
          <HiBell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
        </button>

        <button
          onClick={() => navigate('/sale?new=true')}
          className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 active:scale-[0.98]"
        >
          <HiPlus size={16} />
          Add Sale
        </button>

        <button
          onClick={() => navigate('/purchase?new=true')}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 active:scale-[0.98]"
        >
          <HiPlus size={16} />
          Add Purchase
        </button>

        <button
          onClick={logout}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          title="Logout"
        >
          <HiLogout size={20} />
        </button>
      </div>
    </motion.header>
  );
}
