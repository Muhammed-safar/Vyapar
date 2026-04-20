import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { formatCurrency, formatDate, getPartyById, calculateTotalSales, calculateTotalPurchases } from '../utils/helpers';
import { motion } from 'framer-motion';
import { HiChartBar, HiTrendingUp, HiTrendingDown, HiDocumentText } from 'react-icons/hi';

export default function ReportsPage() {
  const { transactions, parties, payments } = useApp();

  const totalSales = useMemo(() => calculateTotalSales(transactions), [transactions]);
  const totalPurchases = useMemo(() => calculateTotalPurchases(transactions), [transactions]);
  const profit = useMemo(() => totalSales - totalPurchases, [totalSales, totalPurchases]);

  const allTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Business overview and analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success-50 rounded-lg">
              <HiTrendingUp size={20} className="text-success-500" />
            </div>
            <span className="text-sm text-gray-500">Total Sales</span>
          </div>
          <p className="text-2xl font-bold text-success-600">{formatCurrency(totalSales)}</p>
          <p className="text-xs text-gray-400 mt-1">{transactions.filter(t => t.type === 'SALE').length} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-danger-50 rounded-lg">
              <HiTrendingDown size={20} className="text-danger-500" />
            </div>
            <span className="text-sm text-gray-500">Total Purchases</span>
          </div>
          <p className="text-2xl font-bold text-danger-600">{formatCurrency(totalPurchases)}</p>
          <p className="text-xs text-gray-400 mt-1">{transactions.filter(t => t.type === 'PURCHASE').length} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-50 rounded-lg">
              <HiChartBar size={20} className="text-primary-500" />
            </div>
            <span className="text-sm text-gray-500">Net Profit</span>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {formatCurrency(Math.abs(profit))}
            {profit < 0 && ' (Loss)'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Sales - Purchases</p>
        </motion.div>
      </div>

      {/* All Transactions / Daybook */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4">All Transactions (Daybook)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {allTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <HiDocumentText size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No transactions yet</p>
                  </td>
                </tr>
              ) : (
                allTransactions.map((tx, idx) => {
                  const party = getPartyById(parties, tx.partyId);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="table-cell text-gray-500">{formatDate(tx.date)}</td>
                      <td className="table-cell">
                        <span className={`badge ${tx.type === 'SALE' ? 'badge-success' : 'badge-danger'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="table-cell font-medium text-gray-800 dark:text-gray-200">
                        {party?.name || 'Unknown'}
                      </td>
                      <td className="table-cell font-semibold">{formatCurrency(tx.totalAmount)}</td>
                      <td className="table-cell text-success-600">{formatCurrency(tx.paidAmount)}</td>
                      <td className="table-cell text-danger-600 font-medium">
                        {tx.balance > 0 ? formatCurrency(tx.balance) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Party Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4">Party Statement</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Transactions</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {parties.map(party => {
                const partyTxs = transactions.filter(t => t.partyId === party.id);
                const totalAmount = partyTxs.reduce((s, t) => s + t.totalAmount, 0);
                return (
                  <tr key={party.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="table-cell font-medium text-gray-800 dark:text-gray-200">{party.name}</td>
                    <td className="table-cell">
                      <span className={`badge ${party.type === 'customer' ? 'badge-primary' : 'bg-purple-50 text-purple-600'}`}>
                        {party.type}
                      </span>
                    </td>
                    <td className="table-cell">{partyTxs.length}</td>
                    <td className="table-cell font-semibold">{formatCurrency(totalAmount)}</td>
                    <td className="table-cell">
                      <span className={`font-semibold ${
                        party.balance > 0 ? 'text-success-600' : party.balance < 0 ? 'text-danger-600' : 'text-gray-400'
                      }`}>
                        {formatCurrency(Math.abs(party.balance))}
                        {party.balance > 0 && ' ↓'}
                        {party.balance < 0 && ' ↑'}
                      </span>
                    </td>
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
