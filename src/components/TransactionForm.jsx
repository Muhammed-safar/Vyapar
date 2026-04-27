import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { PAYMENT_TYPES } from '../utils/constants';
import { roundTo2 } from '../utils/helpers';
import { HiPlus, HiTrash, HiSearch, HiUserAdd, HiCheck, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { createParty } from '../services/api';

export default function TransactionForm({ type = 'SALE', initialData, onSubmit, onClose }) {
  const { parties, products, loadAllData } = useApp();

  const filteredParties = useMemo(() => {
    return parties.filter(p => {
      if (type === 'SALE' || type === 'SALE_RETURN') return p.type === 'customer';
      if (type === 'PURCHASE' || type === 'PURCHASE_RETURN') return p.type === 'supplier';
      return true;
    });
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

  const isNewSaleReturn = type === 'SALE_RETURN' && initialData && !initialData.type?.includes('RETURN');
  const isNewPurchaseReturn = type === 'PURCHASE_RETURN' && initialData && !initialData.type?.includes('RETURN');
  const isNewReturn = isNewSaleReturn || isNewPurchaseReturn;

  useEffect(() => {
    if (initialData) {
      // Check if this is an "edit" of an existing transaction or a "new" one based on initialData (like a return from sale)

      setForm({
        partyId: initialData.partyId,
        date: isNewReturn ? new Date().toISOString().split('T')[0] : initialData.date,
        items: initialData.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            ...item,
            productName: product?.name || 'Unknown',
            maxStock: (product?.stockQuantity || 0) + ((type === 'SALE' || (type === 'PURCHASE_RETURN' && !isNewReturn)) ? item.quantity : 0),
            unit: product?.unit || '',
          };
        }),
        paidAmount: isNewReturn ? '' : initialData.paidAmount,
        paymentType: initialData.paymentType,
        discount: initialData.discount,
        tax: initialData.tax,
        notes: initialData.notes || (isNewReturn ? `Return from Sale Invoice` : ''),
      });
    }
  }, [initialData, products, type]);

  const [searchProduct, setSearchProduct] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [errors, setErrors] = useState({});

  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  useEffect(() => {
    if (initialData && parties.length > 0) {
      const p = parties.find(x => x.id === initialData.partyId);
      if (p) {
        setForm(f => ({ ...f, partyId: p.id }));
        setPartyName(p.name);
        setPartyPhone(p.phone || '');
      }
    }
  }, [initialData, parties]);

  const filteredPartyOptions = useMemo(() => {
    if (!partyName || form.partyId) return [];
    const searchLower = partyName.toLowerCase();
    return filteredParties.filter(p => 
      (p.phone && p.phone.toLowerCase().includes(searchLower)) ||
      (p.name && p.name.toLowerCase().includes(searchLower))
    );
  }, [filteredParties, partyName, form.partyId]);

  const handleNameChange = (e) => {
    setPartyName(e.target.value);
    setShowPartyDropdown(true);
    if (form.partyId) {
      setForm(f => ({ ...f, partyId: '' }));
    }
  };

  const handlePhoneChange = (e) => {
    setPartyPhone(e.target.value);
    if (form.partyId) {
      setForm(f => ({ ...f, partyId: '' }));
    }
  };

  const selectParty = (party) => {
    setForm({ ...form, partyId: party.id });
    setPartyName(party.name);
    setPartyPhone(party.phone || '');
    setShowPartyDropdown(false);
    setErrors({ ...errors, party: null });
  };

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
      if ((type === 'SALE' || type === 'PURCHASE_RETURN') && qty > item.maxStock) {
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

  // Quick party add logic removed. Merged into handleSubmit.

  const subtotal = useMemo(() => {
    return roundTo2(form.items.reduce((sum, item) => sum + item.total, 0));
  }, [form.items]);

  const taxAmount = useMemo(() => {
    return roundTo2((subtotal - (Number(form.discount) || 0)) * (Number(form.tax) / 100));
  }, [subtotal, form.discount, form.tax]);

  const totalAmount = useMemo(() => {
    const rawTotal = subtotal - (Number(form.discount) || 0) + taxAmount;
    return form.paymentType === 'upi' ? roundTo2(rawTotal) : Math.ceil(rawTotal);
  }, [subtotal, form.discount, taxAmount, form.paymentType]);

  const balance = useMemo(() => {
    return roundTo2(totalAmount - (Number(form.paidAmount) || 0));
  }, [totalAmount, form.paidAmount]);

  const validate = () => {
    const errs = {};
    if (!partyName.trim()) errs.party = `${partyLabel} name is required`;
    if (form.items.length === 0) errs.items = 'Add at least one product';
    if (form.paidAmount && Number(form.paidAmount) < 0) errs.payment = 'Invalid payment amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let finalPartyId = form.partyId;
    let newPartyData = null;

    if (!finalPartyId) {
      try {
        const res = await createParty({
          name: partyName,
          phone: partyPhone,
          type: type === 'SALE' || type === 'SALE_RETURN' ? 'customer' : 'supplier',
          balance: 0,
        });
        finalPartyId = res.data.id;
        newPartyData = res.data;
        await loadAllData();
      } catch (err) {
        setErrors({ ...errors, party: 'Failed to create new party' });
        return;
      }
    }

    const transactionData = {
      type,
      partyId: finalPartyId,
      newPartyData,
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
      originalSaleId: isNewSaleReturn ? initialData.id : (initialData?.originalSaleId || null),
      originalPurchaseId: isNewPurchaseReturn ? initialData.id : (initialData?.originalPurchaseId || null),
    };

    onSubmit(transactionData);
  };

  const isSale = type === 'SALE';
  const isPurchase = type === 'PURCHASE';

  const partyLabel = (type === 'SALE' || type === 'SALE_RETURN') ? 'Customer' : 'Supplier';
  const submitLabel = type === 'SALE_RETURN' ? 'Save & Return Stock' : 
                      type === 'PURCHASE_RETURN' ? 'Save & Return to Supplier' :
                      isPurchase ? 'Confirm Purchase Bill' : 
                      'Save & Generate Invoice';
  const submitColor = (type === 'SALE' || type === 'SALE_RETURN') ? 'from-rose-500 to-red-600 shadow-red-500/30' : 'from-blue-500 to-blue-700 shadow-blue-500/30';
  const paidAmountLabel = type === 'SALE_RETURN' ? 'Refunded Amt (₹)' : 
                          type === 'PURCHASE_RETURN' ? 'Refund Amt (₹)' :
                          isPurchase ? 'Paid Amt (₹)' : 'Received Amt (₹)';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Party Selection & Quick Add */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            {partyLabel} Name *
          </label>
          <div className="flex items-center">
            <HiSearch className="absolute left-3 text-gray-400" size={18} />
            <input
              type="text"
              value={partyName}
              onChange={handleNameChange}
              onFocus={() => setShowPartyDropdown(true)}
              onBlur={() => setTimeout(() => setShowPartyDropdown(false), 200)}
              placeholder={`Search or enter name...`}
              className="input-field pl-10"
            />
          </div>

          <AnimatePresence>
            {showPartyDropdown && filteredPartyOptions.length > 0 && !form.partyId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-30 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto"
              >
                {filteredPartyOptions.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectParty(p)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                      {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                    </div>
                    <HiPlus size={16} className="text-primary-500" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {errors.party && <p className="text-danger-500 text-xs mt-1">{errors.party}</p>}
        </div>

        <div className="md:col-span-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Phone Number
          </label>
          <input
            type="tel"
            value={partyPhone}
            onChange={handlePhoneChange}
            placeholder="Enter phone..."
            className="input-field"
          />
        </div>

        <div className="md:col-span-1">
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
              onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
              className="input-field pl-10"
              placeholder="Search products..."
            />
          </div>

          <AnimatePresence>
            {showProductDropdown && (
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
                step="any"
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
                step="any"
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
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{paidAmountLabel}</label>
              <input
                type="number"
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                className="input-field py-2 text-center font-bold"
                placeholder="0"
                min="0"
                step="any"
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
          className={`flex-2 font-bold py-3 px-8 rounded-xl text-white shadow-lg transition-all duration-200 active:scale-[0.98] bg-gradient-to-r ${submitColor}`}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
