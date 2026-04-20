import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { createParty, updateParty, deleteParty as deletePartyApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import Modal from '../components/Modal';
import PartyForm from '../components/PartyForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { motion } from 'framer-motion';
import { HiPlus, HiSearch, HiPencil, HiTrash, HiPhone, HiUserGroup } from 'react-icons/hi';

export default function PartiesPage() {
  const { parties, loadAllData } = useApp();
  const [tab, setTab] = useState('customer');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filteredParties = useMemo(() => {
    return parties
      .filter(p => p.type === tab)
      .filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
      );
  }, [parties, tab, search]);

  const handleSubmit = async (data) => {
    try {
      if (editingParty) {
        await updateParty(editingParty.id, data);
      } else {
        await createParty(data);
      }
      await loadAllData();
      setShowForm(false);
      setEditingParty(null);
    } catch (err) {
      alert('Error saving party');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePartyApi(id);
      await loadAllData();
    } catch (err) {
      alert('Error deleting party');
    }
  };

  const totalBalanceCustomers = parties
    .filter(p => p.type === 'customer')
    .reduce((sum, p) => sum + p.balance, 0);

  const totalBalanceSuppliers = parties
    .filter(p => p.type === 'supplier')
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Parties</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your customers and suppliers</p>
        </div>
        <button
          onClick={() => { setEditingParty(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <HiPlus size={18} />
          Add Party
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-success-50 rounded-xl">
            <HiUserGroup size={24} className="text-success-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Receivable (Customers)</p>
            <p className="text-xl font-bold text-success-600">{formatCurrency(totalBalanceCustomers)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-danger-50 rounded-xl">
            <HiUserGroup size={24} className="text-danger-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Payable (Suppliers)</p>
            <p className="text-xl font-bold text-danger-600">{formatCurrency(totalBalanceSuppliers)}</p>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setTab('customer')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === 'customer'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Customers ({parties.filter(p => p.type === 'customer').length})
            </button>
            <button
              onClick={() => setTab('supplier')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === 'supplier'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Suppliers ({parties.filter(p => p.type === 'supplier').length})
            </button>
          </div>

          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parties..."
              className="input-field pl-10 w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <HiUserGroup size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No {tab}s found</p>
                  </td>
                </tr>
              ) : (
                filteredParties.map((party, idx) => (
                  <motion.tr
                    key={party.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">{party.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{party.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <HiPhone size={14} />
                        +91 {party.phone}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`font-semibold ${
                        party.balance > 0 ? 'text-success-600' : party.balance < 0 ? 'text-danger-600' : 'text-gray-400'
                      }`}>
                        {formatCurrency(Math.abs(party.balance))}
                        {party.balance > 0 && <span className="text-xs ml-1">receivable</span>}
                        {party.balance < 0 && <span className="text-xs ml-1">payable</span>}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingParty(party); setShowForm(true); }}
                          className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-400 hover:text-primary-500 transition-colors"
                        >
                          <HiPencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(party)}
                          className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 text-gray-400 hover:text-danger-500 transition-colors"
                        >
                          <HiTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingParty(null); }}
        title={editingParty ? 'Edit Party' : 'Add New Party'}
      >
        <PartyForm
          party={editingParty}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditingParty(null); }}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title="Delete Party"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
