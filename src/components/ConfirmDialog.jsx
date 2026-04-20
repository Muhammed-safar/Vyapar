import { motion } from 'framer-motion';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">{title || 'Confirm'}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{message || 'Are you sure you want to proceed?'}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn-outline text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn-danger text-sm"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
