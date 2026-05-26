import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User, AlertCircle } from 'lucide-react';
import axios from 'axios';

const NOTIFICATION_SERVICE_URL = 'http://localhost:5004/api';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${NOTIFICATION_SERVICE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifications(res.data.data);
        // Any notification not read or just keep count of new ones
        const unread = res.data.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle clicking outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      // Mark as read immediately on open
      setUnreadCount(0);
      try {
        await axios.get(`${NOTIFICATION_SERVICE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white font-bold shadow-md shadow-brand-200">
          BA
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">British Auction System</h1>
          <p className="text-xs font-semibold text-slate-400">Enterprise Procurement RFQ Hub</p>
        </div>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggleDropdown}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-slate-200"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5">
              <div className="border-b border-slate-100 px-4 py-2">
                <span className="text-sm font-bold text-slate-800">Notifications Feed</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                    <AlertCircle className="h-8 w-8 mb-2 stroke-1" />
                    <span className="text-xs">No notifications yet</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                        !notif.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <p className="text-xs font-medium text-slate-700 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info Card */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
              user?.role === 'buyer'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {user?.role}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <User className="h-5 w-5" />
          </div>
          <button
            onClick={logout}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition-all hover:bg-red-100"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
