import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { createProduct, updateProduct, deleteProduct as deleteProductApi } from '../services/api';
import { formatCurrency, getCategoryById } from '../utils/helpers';
import Modal from '../components/Modal';
import ItemForm from '../components/ItemForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { motion } from 'framer-motion';
import { HiPlus, HiSearch, HiPencil, HiTrash, HiCube, HiFilter } from 'react-icons/hi';

export default function ItemsPage() {
  const { products, categories, loadAllData } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => !categoryFilter || p.categoryId === Number(categoryFilter))
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search, categoryFilter]);

  const handleSubmit = async (data) => {
    try {
      if (editingItem) {
        await updateProduct(editingItem.id, data);
      } else {
        await createProduct(data);
      }
      await loadAllData();
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      alert('Error saving product');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProductApi(id);
      await loadAllData();
    } catch (err) {
      alert('Error deleting product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Items</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products in inventory</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <HiPlus size={18} />
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="input-field pl-10 w-72"
              />
            </div>
            <div className="relative">
              <HiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field pl-10 w-48"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <HiCube size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              filteredProducts.map((product, idx) => {
                const category = getCategoryById(categories, product.categoryId);
                const lowStock = product.stockQuantity < 10;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl flex items-center justify-center">
                        <HiCube size={20} className="text-primary-500" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingItem(product); setShowForm(true); }}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-500 transition-colors"
                        >
                          <HiPencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product)}
                          className="p-1.5 rounded-lg hover:bg-danger-50 text-gray-400 hover:text-danger-500 transition-colors"
                        >
                          <HiTrash size={14} />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">{product.name}</h4>
                    {category && (
                      <span className="badge-primary text-xs">{category.name}</span>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {formatCurrency(product.price)}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        lowStock
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400'
                      }`}>
                        {product.stockQuantity} {product.unit}
                        {lowStock && ' ⚠️'}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, idx) => {
                  const category = getCategoryById(categories, product.categoryId);
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="table-cell font-medium text-gray-800 dark:text-gray-200">{product.name}</td>
                      <td className="table-cell">
                        {category && <span className="badge-primary">{category.name}</span>}
                      </td>
                      <td className="table-cell font-semibold">{formatCurrency(product.price)}</td>
                      <td className="table-cell">
                        <span className={product.stockQuantity < 10 ? 'text-amber-600 font-medium' : ''}>
                          {product.stockQuantity} {product.unit}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingItem(product); setShowForm(true); }}
                            className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-500 transition-colors"
                          >
                            <HiPencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product)}
                            className="p-2 rounded-lg hover:bg-danger-50 text-gray-400 hover:text-danger-500 transition-colors"
                          >
                            <HiTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingItem(null); }}
        title={editingItem ? 'Edit Product' : 'Add New Product'}
      >
        <ItemForm
          item={editingItem}
          categories={categories}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"?`}
      />
    </div>
  );
}
