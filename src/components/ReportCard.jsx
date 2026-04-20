import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

export default function ReportCard({ title, description, path, delay = 0 }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      onClick={() => navigate(path)}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 cursor-pointer group"
    >
      <div>
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{title}</h4>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <HiArrowRight
        size={18}
        className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200"
      />
    </motion.div>
  );
}
