import { useState, useEffect } from 'react';

export default function PartyForm({ party, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    type: 'customer',
    balance: 0,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (party) {
      setForm({
        name: party.name || '',
        phone: party.phone || '',
        type: party.type || 'customer',
        balance: party.balance || 0,
      });
    }
  }, [party]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Enter valid 10-digit phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      balance: Number(form.balance),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Party Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-field"
          placeholder="Enter name"
        />
        {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
        <div className="flex gap-2">
          <div className="input-field w-20 flex items-center justify-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-700">
            +91
          </div>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            className="input-field flex-1"
            placeholder="9876543210"
            maxLength={10}
          />
        </div>
        {errors.phone && <p className="text-danger-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Party Type</label>
        <div className="flex gap-3">
          <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            form.type === 'customer' 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' 
              : 'border-gray-200 dark:border-gray-600 text-gray-500'
          }`}>
            <input
              type="radio"
              name="type"
              value="customer"
              checked={form.type === 'customer'}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="hidden"
            />
            <span className="text-sm font-medium">Customer</span>
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            form.type === 'supplier' 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' 
              : 'border-gray-200 dark:border-gray-600 text-gray-500'
          }`}>
            <input
              type="radio"
              name="type"
              value="supplier"
              checked={form.type === 'supplier'}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="hidden"
            />
            <span className="text-sm font-medium">Supplier</span>
          </label>
        </div>
      </div>

      {!party && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Balance (₹)</label>
          <input
            type="number"
            value={form.balance}
            onChange={(e) => setForm({ ...form, balance: e.target.value })}
            className="input-field"
            placeholder="0"
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">{party ? 'Update' : 'Add'} Party</button>
      </div>
    </form>
  );
}
