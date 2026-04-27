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
export const deletePayment = (id) => api.delete(`/payments/${id}`);

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
  if (!party) {
    throw new Error('Customer information is missing. Cannot update balance.');
  }
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
  if (!party) {
    throw new Error('Supplier information is missing. Cannot update balance.');
  }
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

// Full Sale Return Transaction Flow
export const processSaleReturnTransaction = async (transactionData, products, party) => {
  // 1. Create transaction
  const txRes = await createTransaction(transactionData);

  // 2. Increase stock for each item (customer returned items)
  for (const item of transactionData.items) {
    const product = products.find(p => p.id === item.productId);
    const currentStock = product ? product.stockQuantity : 0;
    await updateStock(item.productId, currentStock + item.quantity);
  }

  // 3. Update party balance (decrease customer receivable)
  if (!party) {
    throw new Error('Customer information is missing. Cannot update balance.');
  }
  const newBalance = (party.balance || 0) - transactionData.balance;
  await updatePartyBalance(party.id, newBalance);

  // 4. Create payment record (if money returned to customer)
  if (transactionData.paidAmount > 0) {
    await createPayment({
      transactionId: txRes.data.id,
      partyId: party.id,
      amount: -transactionData.paidAmount, // Negative for outflow
      paymentType: transactionData.paymentType || 'cash',
      date: transactionData.date,
    });
  }

  return txRes.data;
};

// Full Purchase Return Transaction Flow
export const processPurchaseReturnTransaction = async (transactionData, products, party) => {
  // 1. Validate stock
  for (const item of transactionData.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product || product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product?.name || 'product'}. Available: ${product?.stockQuantity || 0}`);
    }
  }

  // 2. Create transaction
  const txRes = await createTransaction(transactionData);

  // 3. Decrease stock for each item (returning items to supplier)
  for (const item of transactionData.items) {
    const product = products.find(p => p.id === item.productId);
    const currentStock = product ? product.stockQuantity : 0;
    await updateStock(item.productId, currentStock - item.quantity);
  }

  // 4. Update party balance (supplier payable decreases)
  if (!party) {
    throw new Error('Supplier information is missing. Cannot update balance.');
  }
  const newBalance = (party.balance || 0) + transactionData.balance;
  await updatePartyBalance(party.id, newBalance);

  // 5. Create payment record (if money received from supplier)
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



// Revert Transaction side effects and Delete
export const processDeleteTransaction = async (transaction, products, party, payments) => {
  // 1. Revert stock
  for (const item of transaction.items) {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      let newStock;
      if (transaction.type === 'SALE' || transaction.type === 'PURCHASE_RETURN') {
        newStock = product.stockQuantity + item.quantity;
      } else if (transaction.type === 'PURCHASE' || transaction.type === 'SALE_RETURN') {
        newStock = product.stockQuantity - item.quantity;
      }
      await updateStock(product.id, newStock);
    }
  }

  // 2. Revert party balance
  if (party) {
    let balanceChange;
    if (transaction.type === 'SALE' || transaction.type === 'PURCHASE_RETURN') {
      balanceChange = -transaction.balance;
    } else {
      balanceChange = transaction.balance;
    }
    await updatePartyBalance(party.id, (party.balance || 0) + balanceChange);
  }

  // 3. Delete associated payments
  const transactionPayments = (payments || []).filter(p => p.transactionId === transaction.id);
  for (const payment of transactionPayments) {
    await deletePayment(payment.id);
  }

  // 4. Delete transaction
  await deleteTransaction(transaction.id);
};

export default api;
