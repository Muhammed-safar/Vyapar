import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { formatCurrency, formatDate, getPartyById } from '../utils/helpers';
import { PAYMENT_TYPES } from '../utils/constants';
import { motion } from 'framer-motion';
import { HiCash } from 'react-icons/hi';

export default function CashBankPage() {
  const { payments, parties } = useApp();

  const sortedPayments = useMemo(() => [...payments].sort((a, b) => new Date(b.date) - new Date(a.date)), [payments]);
  const totalCash = payments.filter(p => p.paymentType === 'cash').reduce((s, p) => s + p.amount, 0);
  const totalBank = payments.filter(p => p.paymentType === 'bank').reduce((s, p) => s + p.amount, 0);
  const totalUpi = payments.filter(p => p.paymentType === 'upi').reduce((s, p) => s + p.amount, 0);

  const getPaymentLabel = (type) => PAYMENT_TYPES.find(pt => pt.value === type)?.label || type;
  const icons = { cash: '💵', bank: '🏦', upi: '📱', cheque: '📝', credit: '💳' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Cash & Bank</h1>
        <p className="text-sm text-gray-500 mt-1">Track all your payments</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{ label: 'Cash', val: totalCash, icon: '💵' }, { label: 'Bank Transfer', val: totalBank, icon: '🏦' }, { label: 'UPI', val: totalUpi, icon: '📱' }].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card">
            <div className="flex items-center gap-3 mb-2"><span className="text-2xl">{item.icon}</span><span className="text-sm text-gray-500">{item.label}</span></div>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.val)}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="table-header"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Party</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Type</th></tr></thead>
            <tbody>
              {sortedPayments.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400"><HiCash size={48} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No payments</p></td></tr>
              ) : sortedPayments.map(p => {
                const party = getPartyById(parties, p.partyId);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="table-cell text-gray-500">{formatDate(p.date)}</td>
                    <td className="table-cell font-medium text-gray-800 dark:text-gray-200">{party?.name || 'Unknown'}</td>
                    <td className="table-cell font-semibold text-success-600">{formatCurrency(p.amount)}</td>
                    <td className="table-cell"><span className="flex items-center gap-2"><span>{icons[p.paymentType] || '💰'}</span>{getPaymentLabel(p.paymentType)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
