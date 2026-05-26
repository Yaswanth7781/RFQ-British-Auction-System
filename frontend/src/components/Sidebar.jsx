import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FilePlus, Landmark, Settings, ClipboardList } from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const isBuyer = user?.role === 'buyer';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-[calc(100vh-4rem)] shadow-lg">
      <div className="p-4 border-b border-slate-800">
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Navigation Menu</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {isBuyer ? (
          <>
            <NavLink
              to="/buyer-dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Buyer Console</span>
            </NavLink>

            <NavLink
              to="/create-rfq"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <FilePlus className="h-4 w-4" />
              <span>Create RFQ</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/seller-dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Landmark className="h-4 w-4" />
              <span>Supplier Console</span>
            </NavLink>
          </>
        )}

        <div className="pt-4 mt-4 border-t border-slate-800">
          <p className="px-4 text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Workspace</p>
          <div className="px-4 py-2 rounded-lg bg-slate-800/40 text-xs border border-slate-800/60">
            <span className="block font-semibold text-slate-300">Environment</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Docker Sandbox / REST</span>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-semibold text-center">
        © 2026 British Auction Hub
      </div>
    </aside>
  );
};

export default Sidebar;
