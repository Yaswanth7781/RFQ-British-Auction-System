import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ChevronLeft, ShieldAlert } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [localError, setLocalError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    try {
      const user = await register(name, email, password, role);
      if (user.role === 'buyer') {
        navigate('/buyer-dashboard');
      } else {
        navigate('/seller-dashboard');
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="p-6 bg-slate-900 text-white">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 mb-4 transition-all"
          >
            <ChevronLeft className="h-3 w-3" /> Back to Home
          </button>
          <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
          <p className="text-xs opacity-75 mt-1">
            Register to join the British Auction RFQ hub
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {localError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`py-2 px-4 rounded-xl border text-xs font-bold transition-all ${
                  role === 'buyer'
                    ? 'border-brand-600 bg-brand-50 text-brand-700 font-extrabold ring-1 ring-brand-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Procurement Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`py-2 px-4 rounded-xl border text-xs font-bold transition-all ${
                  role === 'seller'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-extrabold ring-1 ring-emerald-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Supplier Partner
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-400">Already have an account? </span>
            <Link
              to="/"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Sign In Here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
