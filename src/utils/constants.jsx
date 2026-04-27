import {
  HiHome,
  HiUserGroup,
  HiCube,
  HiShoppingCart,
  HiTruck,
  HiCog,
} from 'react-icons/hi';

export const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: HiHome, path: '/' },
  { id: 'parties', label: 'Parties', icon: HiUserGroup, path: '/parties' },
  { id: 'items', label: 'Items', icon: HiCube, path: '/items' },
  {
    id: 'sale',
    label: 'Sale',
    icon: HiShoppingCart,
    path: '/sale',
    children: [
      { id: 'sale-invoices', label: 'Sale Invoices', path: '/sale' },
      { id: 'sale-returns', label: 'Sale Returns', path: '/sale/returns' },
    ],
  },
  {
    id: 'purchase',
    label: 'Purchase',
    icon: HiTruck,
    path: '/purchase',
    children: [
      { id: 'purchase-bills', label: 'Purchase Bills', path: '/purchase' },
      { id: 'purchase-returns', label: 'Purchase Returns', path: '/purchase/returns' },
    ],
  },
  { id: 'settings', label: 'Settings', icon: HiCog, path: '/settings' },
];

export const PAYMENT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'credit', label: 'Credit' },
];

export const UNITS = [
  'pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'bag', 'ream', 'dozen', 'set', 'pair',
];



export const API_BASE_URL = 'http://localhost:3001';
