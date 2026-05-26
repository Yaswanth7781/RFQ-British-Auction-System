import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ChevronLeft, ShieldAlert } from 'lucide-react';

const Login = ({ role }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isBuyer = role === 'buyer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      // Ensure the logged-in user matches the intended portal role
      if (user.role !== role) {
        throw new Error(`Unauthorized. This credentials belong to a ${user.role}.`);
      }
      // Redirect based on role
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className={`p-6 text-white ${isBuyer ? 'bg-brand-600' : 'bg-emerald-600'}`}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 mb-4 transition-all"
          >
            <ChevronLeft className="h-3 w-3" /> Back to Home
          </button>
          <h2 className="text-2xl font-bold tracking-tight">
            {isBuyer ? 'Buyer Login' : 'Seller Login'}
          </h2>
          <p className="text-xs opacity-75 mt-1">
            {isBuyer
              ? 'Access your procurement console to publish RFQs'
              : 'Access your bidding console to submit quotations'}
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
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              isBuyer
                ? 'bg-brand-600 hover:bg-brand-500 shadow-brand-200'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200'
            }`}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-400">Don't have an account? </span>
            <Link
              to="/register"
              className={`text-xs font-bold transition-colors ${
                isBuyer ? 'text-brand-600 hover:text-brand-700' : 'text-emerald-600 hover:text-emerald-700'
              }`}
            >
              Register Here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
