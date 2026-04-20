import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { processSaleTransaction } from '../services/api';
import { formatCurrency, formatDate, getPartyById, generateInvoiceNumber, getPaymentStatus } from '../utils/helpers';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { motion } from 'framer-motion';
import { HiPlus, HiSearch, HiShoppingCart, HiCalendar } from 'react-icons/hi';
import { useSearchParams } from 'react-router-dom';

export default function SalePage() {
  const { transactions, parties, products, loadAllData } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const saleTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === 'SALE')
      .filter(t => {
        if (search) {
          const party = getPartyById(parties, t.partyId);
          return party?.name.toLowerCase().includes(search.toLowerCase());
        }
        return true;
      })
      .filter(t => {
        if (dateFilter) return t.date === dateFilter;
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, parties, search, dateFilter]);

  const handleCreateSale = async (data) => {
    try {
      const party = parties.find(p => p.id === data.partyId);
      await processSaleTransaction(data, products, party);
      await loadAllData();
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Error creating sale');
    }
  };

  const totalSales = saleTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Sale Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {saleTransactions.length} invoices • Total: {formatCurrency(totalSales)}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 active:scale-[0.98]"
        >
          <HiPlus size={18} />
          New Sale Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name..."
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <HiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field pl-10 w-48"
            />
          </div>
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-primary-500 hover:underline">Clear</button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {saleTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <HiShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No sale invoices found</p>
                    <button onClick={() => setShowForm(true)} className="text-primary-500 text-sm mt-2 hover:underline">
                      Create your first sale
                    </button>
                  </td>
                </tr>
              ) : (
                saleTransactions.map((tx, idx) => {
                  const party = getPartyById(parties, tx.partyId);
                  const status = getPaymentStatus(tx.paidAmount, tx.totalAmount);

                  return (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="table-cell font-mono text-sm font-medium text-primary-600">
                        {generateInvoiceNumber('SALE', tx.id)}
                      </td>
                      <td className="table-cell font-medium text-gray-800 dark:text-gray-200">
                        {party?.name || 'Unknown'}
                      </td>
                      <td className="table-cell text-gray-500">{formatDate(tx.date)}</td>
                      <td className="table-cell font-semibold">{formatCurrency(tx.totalAmount)}</td>
                      <td className="table-cell text-success-600">{formatCurrency(tx.paidAmount)}</td>
                      <td className="table-cell font-semibold text-danger-600">
                        {tx.balance > 0 ? formatCurrency(tx.balance) : '-'}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          status === 'Paid' ? 'badge-success' :
                          status === 'Partial' ? 'bg-amber-50 text-amber-600' :
                          'badge-danger'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Create Sale Invoice"
        size="lg"
      >
        <TransactionForm
          type="SALE"
          onSubmit={handleCreateSale}
          onClose={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
