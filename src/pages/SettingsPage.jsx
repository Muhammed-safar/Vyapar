import { updateSettings } from '../services/api';

export default function SettingsPage() {
  const { businessName, dispatch, darkMode, user } = useApp();
  const [name, setName] = useState(businessName || '');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    dispatch({ type: 'SET_BUSINESS_NAME', payload: name });
    try {
      await updateSettings({ businessName: name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your app preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-50 rounded-lg"><HiOfficeBuilding size={20} className="text-primary-500" /></div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Business Info</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Enter your business name" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="btn-primary">Save Changes</button>
            {saved && <span className="text-success-500 text-sm animate-fade-in">✓ Saved!</span>}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 rounded-lg">{darkMode ? <HiMoon size={20} className="text-purple-500" /> : <HiSun size={20} className="text-amber-500" />}</div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Appearance</h3>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">Dark Mode</p>
            <p className="text-xs text-gray-500 mt-0.5">Switch between light and dark theme</p>
          </div>
          <button onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })} className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${darkMode ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-success-50 rounded-lg"><HiUser size={20} className="text-success-500" /></div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Account</h3>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">Logged in as: <span className="font-semibold text-gray-800 dark:text-gray-200">+91 {user?.phone || 'N/A'}</span></p>
        </div>
      </motion.div>
    </div>
  );
}
