import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { PAYMENT_TYPES } from '../utils/constants';
import { roundTo2 } from '../utils/helpers';
import { HiPlus, HiTrash, HiSearch, HiUserAdd, HiCheck, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { createParty } from '../services/api';

export default function TransactionForm({ type = 'SALE', onSubmit, onClose }) {
  const { parties, products, loadAllData } = useApp();

  const filteredParties = useMemo(() => {
    return parties.filter(p =>
      type === 'SALE' ? p.type === 'customer' : p.type === 'supplier'
    );
  }, [parties, type]);

  const [form, setForm] = useState({
    partyId: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    paidAmount: '',
    paymentType: 'cash',
    discount: 0,
    tax: 0,
    notes: '',
  });

  const [searchProduct, setSearchProduct] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [newParty, setNewParty] = useState({ name: '', phone: '' });
  const [addingParty, setAddingParty] = useState(false);
  const [errors, setErrors] = useState({});

  const filteredProducts = useMemo(() => {
    if (!searchProduct) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase())
    );
  }, [products, searchProduct]);

  const addItem = (product) => {
    const existing = form.items.find(i => i.productId === product.id);
    if (existing) {
      setErrors({ ...errors, product: 'Product already added' });
      return;
    }

    setForm({
      ...form,
      items: [
        ...form.items,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
          total: product.price,
          maxStock: product.stockQuantity,
          unit: product.unit,
        },
      ],
    });
    setSearchProduct('');
    setShowProductDropdown(false);
    setErrors({ ...errors, product: null });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    const item = { ...newItems[index] };

    if (field === 'quantity') {
      const qty = Number(value);
      if (type === 'SALE' && qty > item.maxStock) {
        setErrors({ ...errors, [`item_${index}`]: `Max stock: ${item.maxStock}` });
        return;
      }
      item.quantity = qty;
      setErrors({ ...errors, [`item_${index}`]: null });
    } else if (field === 'price') {
      item.price = Number(value);
    }
    item.total = roundTo2(item.quantity * item.price);
    newItems[index] = item;
    setForm({ ...form, items: newItems });
  };

  const removeItem = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleQuickAddParty = async () => {
    if (!newParty.name) {
      setErrors({ ...errors, newParty: 'Name is required' });
      return;
    }
    setAddingParty(true);
    try {
      const res = await createParty({
        ...newParty,
        type: type === 'SALE' ? 'customer' : 'supplier',
        balance: 0,
      });
      await loadAllData();
      setForm({ ...form, partyId: res.data.id });
      setShowAddParty(false);
      setNewParty({ name: '', phone: '' });
      setErrors({ ...errors, newParty: null });
    } catch (err) {
      setErrors({ ...errors, newParty: 'Failed to add party' });
    } finally {
      setAddingParty(false);
    }
  };

  const subtotal = useMemo(() => {
    return roundTo2(form.items.reduce((sum, item) => sum + item.total, 0));
  }, [form.items]);

  const taxAmount = useMemo(() => {
    return roundTo2((subtotal - (Number(form.discount) || 0)) * (Number(form.tax) / 100));
  }, [subtotal, form.discount, form.tax]);

  const totalAmount = useMemo(() => {
    return roundTo2(subtotal - (Number(form.discount) || 0) + taxAmount);
  }, [subtotal, form.discount, taxAmount]);

  const balance = useMemo(() => {
    return roundTo2(totalAmount - (Number(form.paidAmount) || 0));
  }, [totalAmount, form.paidAmount]);

  const validate = () => {
    const errs = {};
    if (!form.partyId) errs.party = `Select or add a ${type === 'SALE' ? 'customer' : 'supplier'}`;
    if (form.items.length === 0) errs.items = 'Add at least one product';
    if (form.paidAmount && Number(form.paidAmount) < 0) errs.payment = 'Invalid payment amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const transactionData = {
      type,
      partyId: Number(form.partyId),
      date: form.date,
      totalAmount,
      paidAmount: Number(form.paidAmount) || 0,
      balance,
      discount: Number(form.discount) || 0,
      tax: Number(form.tax) || 0,
      notes: form.notes,
      items: form.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      })),
      paymentType: form.paymentType,
    };

    onSubmit(transactionData);
  };

  const isSale = type === 'SALE';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Party Selection & Quick Add */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isSale ? 'Customer' : 'Supplier'} *
            </label>
            <button
              type="button"
              onClick={() => setShowAddParty(!showAddParty)}
              className="text-xs text-primary-500 hover:text-primary-700 font-semibold flex items-center gap-1"
            >
              {showAddParty ? <HiX size={14} /> : <HiPlus size={14} />}
              {showAddParty ? 'Cancel' : 'Add New'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showAddParty ? (
              <motion.div
                key="add-party"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-primary-200 dark:border-primary-800"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Name *"
                    className="input-field py-1.5 text-xs flex-1"
                    value={newParty.name}
                    onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="input-field py-1.5 text-xs flex-1"
                    value={newParty.phone}
                    onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddParty}
                    disabled={addingParty}
                    className="p-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                  >
                    {addingParty ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <HiCheck size={18} />
                    )}
                  </button>
                </div>
                {errors.newParty && <p className="text-danger-500 text-[10px]">{errors.newParty}</p>}
              </motion.div>
            ) : (
              <motion.div
                key="select-party"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <select
                  value={form.partyId}
                  onChange={(e) => setForm({ ...form, partyId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select {isSale ? 'Customer' : 'Supplier'}</option>
                  {filteredParties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>
          {errors.party && <p className="text-danger-500 text-xs mt-1">{errors.party}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      {/* Add Products */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Products *</label>
        <div className="relative">
          <div className="flex items-center">
            <HiSearch className="absolute left-3 text-gray-400" size={18} />
            <input
              type="text"
              value={searchProduct}
              onChange={(e) => {
                setSearchProduct(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              className="input-field pl-10"
              placeholder="Search products..."
            />
          </div>

          <AnimatePresence>
            {showProductDropdown && searchProduct && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto"
              >
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                ) : (
                  filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addItem(p)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                        <p className="text-xs text-gray-400">₹{p.price} • Stock: {p.stockQuantity} {p.unit}</p>
                      </div>
                      <HiPlus size={16} className="text-primary-500" />
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {errors.items && <p className="text-danger-500 text-xs mt-1">{errors.items}</p>}
        {errors.product && <p className="text-danger-500 text-xs mt-1">{errors.product}</p>}
      </div>

      {/* Items Table */}
      {form.items.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price (₹)</th>
                <th className="px-4 py-3 text-right">Total (₹)</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50 dark:border-gray-700">
                  <td className="px-4 py-3 capitalize">
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{item.productName}</p>
                    {isSale && <p className="text-[10px] text-gray-400">Stock: {item.maxStock} {item.unit}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      min="1"
                      className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-sm text-center outline-none focus:border-primary-500"
                    />
                    {errors[`item_${idx}`] && (
                      <p className="text-danger-500 text-[10px] mt-0.5">{errors[`item_${idx}`]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(idx, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-sm text-center outline-none focus:border-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                    ₹{item.total.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-gray-400 hover:text-danger-500 transition-colors"
                    >
                      <HiTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Financial Details & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Notes and Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-mono">Notes / Description</label>
            <textarea
              placeholder="Extra details about this transaction..."
              className="input-field min-h-[100px] resize-none text-sm"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Discount (₹)</label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                className="input-field py-1.5"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-mono">Tax (%)</label>
              <input
                type="number"
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
                className="input-field py-1.5"
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary & Payment */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">₹ {subtotal.toLocaleString('en-IN')}</span>
            </div>
            {Number(form.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-danger-500 font-medium">Discount</span>
                <span className="text-danger-500">- ₹ {Number(form.discount).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Number(form.tax) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({form.tax}%)</span>
                <span>+ ₹ {taxAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-base pt-2">
              <span className="font-bold text-gray-800 dark:text-gray-200">Grand Total</span>
              <span className="font-extrabold text-primary-600 dark:text-primary-400 text-xl">₹ {totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Received Amt (₹)</label>
              <input
                type="number"
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                className="input-field py-2 text-center font-bold"
                placeholder="0"
                min="0"
              />
              {errors.payment && <p className="text-danger-500 text-[10px] mt-1">{errors.payment}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mode</label>
              <select
                value={form.paymentType}
                onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                className="input-field py-2"
              >
                {PAYMENT_TYPES.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={`flex justify-between items-center p-3 rounded-xl ${
            balance > 0 ? 'bg-danger-50 dark:bg-danger-500/10 text-danger-600' : 'bg-success-50 dark:bg-success-500/10 text-success-600'
          }`}>
            <span className="text-sm font-bold uppercase tracking-tight">
              {balance > 0 ? 'Balance Due' : balance < 0 ? 'Change to Return' : 'Fully Settled'}
            </span>
            <span className="font-extrabold text-lg">₹ {Math.abs(balance).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Discard</button>
        <button
          type="submit"
          className={`flex-2 font-bold py-3 px-8 rounded-xl text-white shadow-lg transition-all duration-200 active:scale-[0.98] ${
            isSale
              ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-red-500/30'
              : 'bg-gradient-to-r from-blue-500 to-blue-700 shadow-blue-500/30'
          }`}
        >
          {isSale ? 'Save & Generate Invoice' : 'Confirm Purchase Bill'}
        </button>
      </div>
    </form>
  );
}
