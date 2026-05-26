import React from 'react';
import { Link } from 'react-router-dom';
import { Building, ShieldCheck, TrendingDown, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white font-extrabold shadow-md">
            BA
          </div>
          <span className="text-xl font-bold tracking-tight">British Auction System</span>
        </div>
        <div className="flex gap-4">
          <Link
            to="/register"
            className="text-sm font-semibold hover:text-white text-slate-300 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
            Modern Procurement & Dynamic Bidding
          </h2>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            A state-of-the-art reverse auction hub. Buyers configure requests for quotations (RFQs), and suppliers compete transparently with real-time automatic close-time extensions.
          </p>
        </div>

        {/* Roles Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full mb-12">
          {/* Buyer Card */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 flex flex-col justify-between hover:border-brand-500/60 transition-all group">
            <div>
              <div className="h-12 w-12 rounded-xl bg-brand-600/10 text-brand-400 flex items-center justify-center mb-6">
                <Building className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Procurement Buyer</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Publish Requests for Quotations, customize triggers (rank changes, lowest bid), monitor activity feeds, and audit rankings.
              </p>
            </div>
            <Link
              to="/login/buyer"
              className="w-full text-center py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow-md group-hover:shadow-brand-900/30"
            >
              Access Buyer Portal
            </Link>
          </div>

          {/* Seller Card */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 flex flex-col justify-between hover:border-emerald-500/60 transition-all group">
            <div>
              <div className="h-12 w-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center mb-6">
                <TrendingDown className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Supplier Partner</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                View open requests, submit bids, track ranking tiers (L1, L2, L3) dynamically, and continuously optimize freight/origin charges.
              </p>
            </div>
            <Link
              to="/login/seller"
              className="w-full text-center py-3 bg-emerald-600 hover:bg-emerald-505 text-white font-bold rounded-xl transition-all shadow-md group-hover:shadow-emerald-950/30"
            >
              Access Seller Portal
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-t border-slate-800 pt-12">
          <div>
            <span className="text-2xl font-bold text-white block">Microservices</span>
            <span className="text-xs text-slate-500 block mt-1">Independent Express Hubs</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-white block">Auto-Extension</span>
            <span className="text-xs text-slate-500 block mt-1">British Auction Logic</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-white block">Stateless JWT</span>
            <span className="text-xs text-slate-500 block mt-1">Secure Role Access</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-white block">Dockerized</span>
            <span className="text-xs text-slate-500 block mt-1">Compose Orchestrated</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800 text-center text-xs text-slate-600">
        Enterprise Bidding Platform. Developed with MERN Stack + Microservices.
      </footer>
    </div>
  );
};

export default Home;
