export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const roundTo2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export const getPartyById = (parties, id) => parties.find(p => p.id === id);

export const getProductById = (products, id) => products.find(p => p.id === id);

export const getCategoryById = (categories, id) => categories.find(c => c.id === id);

export const calculateTotalReceivable = (parties) => {
  return roundTo2(
    parties
      .filter(p => p.type === 'customer' && p.balance > 0)
      .reduce((sum, p) => sum + p.balance, 0)
  );
};

export const calculateTotalPayable = (parties) => {
  return roundTo2(
    Math.abs(
      parties
        .filter(p => p.balance < 0)
        .reduce((sum, p) => sum + p.balance, 0)
    )
  );
};

export const calculateTotalSales = (transactions) => {
  return roundTo2(
    transactions
      .filter(t => t.type === 'SALE')
      .reduce((sum, t) => sum + t.totalAmount, 0)
  );
};

export const calculateTotalPurchases = (transactions) => {
  return roundTo2(
    transactions
      .filter(t => t.type === 'PURCHASE')
      .reduce((sum, t) => sum + t.totalAmount, 0)
  );
};

export const generateInvoiceNumber = (type, id) => {
  const prefix = type === 'SALE' ? 'INV' : 'PUR';
  return `${prefix}-${String(id).padStart(4, '0')}`;
};

export const getStatusColor = (balance, type) => {
  if (balance === 0) return 'success';
  if (type === 'SALE') return balance > 0 ? 'danger' : 'success';
  return balance > 0 ? 'danger' : 'success';
};

export const getPaymentStatus = (paidAmount, totalAmount) => {
  if (paidAmount >= totalAmount) return 'Paid';
  if (paidAmount > 0) return 'Partial';
  return 'Unpaid';
};
