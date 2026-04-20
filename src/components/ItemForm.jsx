import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { UNITS } from '../utils/constants';

export default function ItemForm({ item, categories, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    stockQuantity: '',
    unit: 'pcs',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        categoryId: item.categoryId || '',
        price: item.price || '',
        stockQuantity: item.stockQuantity || '',
        unit: item.unit || 'pcs',
      });
    }
  }, [item]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.categoryId) errs.categoryId = 'Category is required';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Valid price is required';
    if (form.stockQuantity === '' || Number(form.stockQuantity) < 0) errs.stockQuantity = 'Valid stock quantity is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-field"
          placeholder="Enter product name"
        />
        {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="input-field"
        >
          <option value="">Select Category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="text-danger-500 text-xs mt-1">{errors.categoryId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sale Price (₹) *</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="input-field"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {errors.price && <p className="text-danger-500 text-xs mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity *</label>
          <input
            type="number"
            value={form.stockQuantity}
            onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
            className="input-field"
            placeholder="0"
            min="0"
          />
          {errors.stockQuantity && <p className="text-danger-500 text-xs mt-1">{errors.stockQuantity}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
        <select
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          className="input-field"
        >
          {UNITS.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">{item ? 'Update' : 'Add'} Product</button>
      </div>
    </form>
  );
}
