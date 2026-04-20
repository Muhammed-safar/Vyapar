import { motion } from 'framer-motion';

export default function DashboardCard({ title, amount, subtitle, icon, trend, color = 'blue', delay = 0 }) {
  const colorClasses = {
    green: {
      bg: 'bg-success-50',
      text: 'text-success-600',
      icon: 'bg-success-100 text-success-500',
      border: 'border-success-100',
    },
    red: {
      bg: 'bg-danger-50',
      text: 'text-danger-600',
      icon: 'bg-danger-100 text-danger-500',
      border: 'border-danger-100',
    },
    blue: {
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      icon: 'bg-primary-100 text-primary-500',
      border: 'border-primary-100',
    },
  };

  const c = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className={`card hover:shadow-lg transition-all duration-300 border ${c.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${c.text}`}>₹ {amount?.toLocaleString('en-IN')}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${c.icon}`}>
          {icon || (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {trend === 'down' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              )}
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  );
}
