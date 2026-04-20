import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiChevronDown,
  HiChevronLeft,
  HiMenuAlt2,
} from 'react-icons/hi';
import { MENU_ITEMS } from '../utils/constants';
import { useApp } from '../store/AppContext';

export default function Sidebar() {
  const { sidebarCollapsed, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (id) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-sidebar flex flex-col fixed left-0 top-0 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-white font-bold text-lg">Vyapar</span>
          </motion.div>
        )}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-sidebar-hover transition-colors"
        >
          {sidebarCollapsed ? <HiMenuAlt2 size={20} /> : <HiChevronLeft size={20} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.id];

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleSubmenu(item.id);
                    if (!isExpanded) navigate(item.path);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`sidebar-item w-full ${active ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {hasChildren && (
                      <HiChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Submenu */}
              <AnimatePresence>
                {hasChildren && isExpanded && !sidebarCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-4"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        to={child.path}
                        className={`sidebar-item py-2 text-xs ${
                          location.pathname === child.path ? 'text-primary-400' : ''
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>


    </motion.aside>
  );
}
