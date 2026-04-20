import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPhone, HiShieldCheck, HiFlag } from 'react-icons/hi';
import { useApp } from '../store/AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpNotification, setShowOtpNotification] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const generateOTP = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
  };

  const handleSendOTP = () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);

    // Simulate network delay for OTP generation
    setTimeout(() => {
      const newOtp = generateOTP();
      setGeneratedOtp(newOtp);
      setLoading(false);
      setOtpSent(true);
      setResendTimer(30);
      setShowOtpNotification(true);

      // Auto-hide notification after 8 seconds
      setTimeout(() => setShowOtpNotification(false), 8000);
    }, 1500);
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    setError('');
    setLoading(true);

    setTimeout(() => {
      const newOtp = generateOTP();
      setGeneratedOtp(newOtp);
      setLoading(false);
      setResendTimer(30);
      setShowOtpNotification(true);
      setTimeout(() => setShowOtpNotification(false), 8000);
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (enteredOtp === generatedOtp) {
        login(phone);
      } else {
        setLoading(false);
        setError('Invalid OTP. Please check and try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      {/* SMS Notification Popup */}
      <AnimatePresence>
        {showOtpNotification && (
          <motion.div
            initial={{ opacity: 0, y: -80, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -80, x: "-50%" }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-6 left-1/2 z-50 w-full max-w-sm"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mx-4">
              <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 border-b border-gray-100">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">💬</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">SMS Message</span>
                <span className="text-xs text-gray-400 ml-auto">now</span>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-800">
                  Your Vyapar verification OTP is: <span className="font-bold text-primary-600 text-lg tracking-widest">{generatedOtp}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Do not share this OTP with anyone. Valid for 5 minutes.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
        </motion.div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/50 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Vyapar</h1>
            <p className="text-gray-500 text-sm">India's #1 Billing & Accounting App</p>
          </div>

          {!otpSent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
                    <HiFlag className="text-orange-500" size={16} />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    placeholder="Enter mobile number"
                    className="input-field flex-1"
                    maxLength={10}
                    autoFocus
                  />
                </div>
                {error && <p className="text-danger-500 text-xs mt-2">{error}</p>}
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-700 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <HiPhone size={18} />
                    Send OTP
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-digit OTP</label>
                <p className="text-xs text-gray-400 mb-4">
                  OTP sent to <span className="font-medium text-gray-600">+91 {phone}</span>
                </p>

                {/* OTP Input Fields */}
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200 ${
                        digit
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                      }`}
                    />
                  ))}
                </div>
                {error && <p className="text-danger-500 text-xs mt-3 text-center">{error}</p>}

                {/* Show OTP hint button */}
                <div className="text-center mt-3">
                  <button
                    onClick={() => setShowOtpNotification(true)}
                    className="text-xs text-primary-500 hover:text-primary-700 hover:underline transition-colors"
                  >
                    📩 Show OTP notification again
                  </button>
                </div>
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-700 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <HiShieldCheck size={18} />
                    Verify & Login
                  </>
                )}
              </button>

              {/* Resend & Change Number */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setOtpSent(false); setOtp(['', '', '', '', '', '']); setError(''); setGeneratedOtp(''); }}
                  className="text-sm text-gray-500 hover:text-primary-500 transition-colors"
                >
                  ← Change Number
                </button>
                <button
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0}
                  className={`text-sm font-medium transition-colors ${
                    resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-500 hover:text-primary-700'
                  }`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Footer Links */}
          <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
            <button className="text-xs text-gray-400 hover:text-primary-500 transition-colors">Restore Backup</button>
            <button className="text-xs text-gray-400 hover:text-primary-500 transition-colors">Referral Code</button>
          </div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-6 mt-6"
        >
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <HiShieldCheck size={16} className="text-success-500" />
            <span>100% Safe & Secure</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="text-orange-500">🇮🇳</span>
            <span>Made with Pride in India</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
