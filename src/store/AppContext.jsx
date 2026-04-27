import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  fetchCategories,
  fetchProducts,
  fetchParties,
  fetchTransactions,
  fetchPayments,
  fetchSettings,
  updateSettings,
} from '../services/api';

const AppContext = createContext();

const storedUser = JSON.parse(localStorage.getItem('vyapar_user') || 'null');
const storedDarkMode = localStorage.getItem('vyapar_darkMode') === 'true';

const initialState = {
  isAuthenticated: !!storedUser,
  user: storedUser,
  businessName: '',
  categories: [],
  products: [],
  parties: [],
  transactions: [],
  payments: [],
  loading: !!storedUser,
  error: null,
  sidebarCollapsed: false,
  darkMode: storedDarkMode,
  settings: {},
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH':
      return { ...state, isAuthenticated: action.payload.isAuthenticated, user: action.payload.user };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null };
    case 'SET_BUSINESS_NAME':
      return { ...state, businessName: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_PARTIES':
      return { ...state, parties: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_PAYMENTS':
      return { ...state, payments: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'TOGGLE_DARK_MODE': {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('vyapar_darkMode', newDarkMode);
      return { ...state, darkMode: newDarkMode };
    }
    case 'SET_ALL_DATA':
      return {
        ...state,
        categories: action.payload.categories,
        products: action.payload.products,
        parties: action.payload.parties,
        transactions: action.payload.transactions,
        payments: action.payload.payments,
        businessName: action.payload.settings?.businessName || '',
        settings: action.payload.settings || {},
        loading: false,
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadAllData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [catRes, prodRes, partyRes, txRes, payRes, setRes] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchParties(),
        fetchTransactions(),
        fetchPayments(),
        fetchSettings(),
      ]);
      dispatch({
        type: 'SET_ALL_DATA',
        payload: {
          categories: catRes.data,
          products: prodRes.data,
          parties: partyRes.data,
          transactions: txRes.data,
          payments: payRes.data,
          settings: setRes.data,
        },
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data. Make sure json-server is running on port 3001.' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    if (state.isAuthenticated) {
      loadAllData();
    }
  }, [state.isAuthenticated, loadAllData]);

  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  const login = (phone) => {
    const user = { phone };
    localStorage.setItem('vyapar_user', JSON.stringify(user));
    dispatch({
      type: 'SET_AUTH',
      payload: { isAuthenticated: true, user },
    });
  };

  const logout = () => {
    localStorage.removeItem('vyapar_user');
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    dispatch,
    login,
    logout,
    loadAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
