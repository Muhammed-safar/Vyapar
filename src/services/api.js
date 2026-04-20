import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Categories
export const fetchCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.patch(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Products
export const fetchProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const updateStock = (id, stockQuantity) => api.patch(`/products/${id}`, { stockQuantity });

// Parties
export const fetchParties = () => api.get('/parties');
export const createParty = (data) => api.post('/parties', data);
export const updateParty = (id, data) => api.patch(`/parties/${id}`, data);
export const deleteParty = (id) => api.delete(`/parties/${id}`);
export const updatePartyBalance = (id, balance) => api.patch(`/parties/${id}`, { balance });

// Transactions
export const fetchTransactions = () => api.get('/transactions');
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.patch(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Payments
export const fetchPayments = () => api.get('/payments');
export const createPayment = (data) => api.post('/payments', data);

// Settings
export const fetchSettings = () => api.get('/settings/1');
export const updateSettings = (data) => api.patch('/settings/1', data);

// Full Sale Transaction Flow
export const processSaleTransaction = async (transactionData, products, party) => {
  // 1. Validate stock
  for (const item of transactionData.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product || product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product?.name || 'product'}. Available: ${product?.stockQuantity || 0}`);
    }
  }

  // 2. Create transaction
  const txRes = await createTransaction(transactionData);

  // 3. Reduce stock for each item
  for (const item of transactionData.items) {
    const product = products.find(p => p.id === item.productId);
    await updateStock(item.productId, product.stockQuantity - item.quantity);
  }

  // 4. Update party balance
  const newBalance = (party.balance || 0) + transactionData.balance;
  await updatePartyBalance(party.id, newBalance);

  // 5. Create payment record
  if (transactionData.paidAmount > 0) {
    await createPayment({
      transactionId: txRes.data.id,
      partyId: party.id,
      amount: transactionData.paidAmount,
      paymentType: transactionData.paymentType || 'cash',
      date: transactionData.date,
    });
  }

  return txRes.data;
};

// Full Purchase Transaction Flow
export const processPurchaseTransaction = async (transactionData, products, party) => {
  // 1. Create transaction
  const txRes = await createTransaction(transactionData);

  // 2. Increase stock for each item
  for (const item of transactionData.items) {
    const product = products.find(p => p.id === item.productId);
    const currentStock = product ? product.stockQuantity : 0;
    await updateStock(item.productId, currentStock + item.quantity);
  }

  // 3. Update party balance (negative for supplier payable)
  const newBalance = (party.balance || 0) - transactionData.balance;
  await updatePartyBalance(party.id, newBalance);

  // 4. Create payment record
  if (transactionData.paidAmount > 0) {
    await createPayment({
      transactionId: txRes.data.id,
      partyId: party.id,
      amount: transactionData.paidAmount,
      paymentType: transactionData.paymentType || 'cash',
      date: transactionData.date,
    });
  }

  return txRes.data;
};

export default api;
