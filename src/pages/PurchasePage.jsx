import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { processPurchaseTransaction, processPurchaseReturnTransaction, processDeleteTransaction } from '../services/api';
import { formatCurrency, formatDate, getPartyById, generateInvoiceNumber, getPaymentStatus } from '../utils/helpers';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import TransactionForm from '../components/TransactionForm';
import { motion } from 'framer-motion';
import { HiPlus, HiSearch, HiTruck, HiCalendar, HiPencil, HiTrash } from 'react-icons/hi';
import { useSearchParams, useLocation } from 'react-router-dom';

export default function PurchasePage() {
  const { transactions, parties, products, payments, loadAllData } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isReturnMode = location.pathname.includes('/returns');

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showPurchaseSelector, setShowPurchaseSelector] = useState(false);
  const [selectedPurchaseForReturn, setSelectedPurchaseForReturn] = useState(null);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const purchaseTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === (isReturnMode ? 'PURCHASE_RETURN' : 'PURCHASE'))
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

  const handleCreatePurchase = async (data) => {
    try {
      if (editingTransaction) {
        // For edit, we first revert the old transaction then apply new one
        const party = getPartyById(parties, editingTransaction.partyId);
        await processDeleteTransaction(editingTransaction, products, party, payments);
      }

      const party = data.newPartyData || parties.find(p => p.id === data.partyId);
      if (isReturnMode) {
        await processPurchaseReturnTransaction(data, products, party);
      } else {
        await processPurchaseTransaction(data, products, party);
      }
      await loadAllData();
      setShowForm(false);
      setEditingTransaction(null);
    } catch (err) {
      alert(err.message || 'Error processing purchase');
    }
  };

  const handleDelete = async () => {
    if (!deletingTransaction) return;
    try {
      const party = getPartyById(parties, deletingTransaction.partyId);
      await processDeleteTransaction(deletingTransaction, products, party, payments);
      await loadAllData();
      setDeletingTransaction(null);
    } catch (err) {
      alert(err.message || 'Error deleting transaction');
    }
  };

  const openEdit = (tx) => {
    setEditingTransaction(tx);
    setShowForm(true);
  };

  const confirmDelete = (tx) => {
    setDeletingTransaction(tx);
    setShowDeleteConfirm(true);
  };

  const totalPurchases = purchaseTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {isReturnMode ? 'Purchase Returns' : 'Purchase Bills'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {purchaseTransactions.length} {isReturnMode ? 'returns' : 'bills'} • Total: {formatCurrency(totalPurchases)}
          </p>
        </div>
        <button
          onClick={() => {
            if (isReturnMode) {
              setShowPurchaseSelector(true);
            } else {
              setShowForm(true);
            }
          }}
          className={`flex items-center gap-2 bg-gradient-to-r ${isReturnMode ? 'from-amber-500 to-amber-600 shadow-amber-500/25' : 'from-blue-500 to-blue-700 shadow-blue-500/25'} text-white font-semibold px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 active:scale-[0.98]`}
        >
          <HiPlus size={18} />
          {isReturnMode ? 'New Purchase Return' : 'New Purchase Bill'}
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
              placeholder="Search by supplier name..."
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
                <th className="px-4 py-3">Bill #</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <HiTruck size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No {isReturnMode ? 'purchase returns' : 'purchase bills'} found</p>
                    <button onClick={() => setShowForm(true)} className="text-primary-500 text-sm mt-2 hover:underline">
                      Create your first {isReturnMode ? 'return' : 'purchase'}
                    </button>
                  </td>
                </tr>
              ) : (
                purchaseTransactions.map((tx, idx) => {
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
                      <td className="table-cell font-mono text-sm font-medium text-blue-600">
                        {generateInvoiceNumber(isReturnMode ? 'P_RETURN' : 'PURCHASE', tx.id)}
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
                      <td className="table-cell text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(tx)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <HiPencil size={16} />
                          </button>
                          <button
                            onClick={() => confirmDelete(tx)}
                            className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <HiTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTransaction(null);
          setSelectedPurchaseForReturn(null);
        }}
        title={editingTransaction ? (isReturnMode ? "Edit Purchase Return" : "Edit Purchase Bill") : (isReturnMode ? "Create Purchase Return" : "Create Purchase Bill")}
        size="lg"
      >
        <TransactionForm
          type={isReturnMode ? "PURCHASE_RETURN" : "PURCHASE"}
          initialData={selectedPurchaseForReturn || editingTransaction}
          onSubmit={handleCreatePurchase}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
            setSelectedPurchaseForReturn(null);
          }}
        />
      </Modal>

      {/* Purchase Selector Modal */}
      <Modal
        isOpen={showPurchaseSelector}
        onClose={() => setShowPurchaseSelector(false)}
        title="Select Purchase to Return"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by supplier or bill #..."
              className="input-field pl-10"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Bill #</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {transactions
                  .filter(t => t.type === 'PURCHASE')
                  .filter(t => {
                    const hasReturn = transactions.some(ret => ret.type === 'PURCHASE_RETURN' && ret.originalPurchaseId === t.id);
                    return !hasReturn;
                  })
                  .filter(t => {
                    if (!search) return true;
                    const party = getPartyById(parties, t.partyId);
                    return party?.name.toLowerCase().includes(search.toLowerCase()) || 
                           generateInvoiceNumber('PURCHASE', t.id).toLowerCase().includes(search.toLowerCase());
                  })
                  .map(purchase => {
                    const party = getPartyById(parties, purchase.partyId);
                    return (
                      <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm text-blue-600">
                          {generateInvoiceNumber('PURCHASE', purchase.id)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                          {party?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDate(purchase.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {formatCurrency(purchase.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedPurchaseForReturn(purchase);
                              setShowPurchaseSelector(false);
                              setShowForm(true);
                            }}
                            className="text-xs font-bold text-blue-500 hover:text-blue-700 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={isReturnMode ? "Delete Purchase Return" : "Delete Purchase Bill"}
        message={`Are you sure you want to delete this ${isReturnMode ? 'return' : 'bill'}? Supplier balance will be reverted.`}
      />
    </div>
  );
}
