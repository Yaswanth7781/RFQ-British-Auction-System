import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Plus, Search, Eye, Filter, ShieldAlert, Award, PlayCircle, FolderMinus } from 'lucide-react';
import axios from 'axios';

const RFQ_SERVICE_URL = 'http://localhost:5002/api/rfq';
const BIDDING_SERVICE_URL = 'http://localhost:5003/api/bid';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    forceClosed: 0
  });

  const fetchRFQs = async () => {
    try {
      const res = await axios.get(`${RFQ_SERVICE_URL}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const list = res.data.data;
        setRfqs(list);
        
        // Calculate stats
        const active = list.filter(r => r.status === 'Active').length;
        const closed = list.filter(r => r.status === 'Closed').length;
        const forceClosed = list.filter(r => r.status === 'Force Closed').length;
        setStats({
          total: list.length,
          active,
          closed,
          forceClosed
        });
      }
    } catch (err) {
      console.error('Error fetching RFQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
    // Poll list every 15 seconds to sync status updates
    const interval = setInterval(fetchRFQs, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Filtered RFQs
  const filteredRfqs = rfqs.filter(rfq => {
    const matchesSearch = rfq.rfqName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rfq.referenceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Buyer Procurement Console</h2>
              <p className="text-xs text-slate-400 mt-1">Manage and audit your active Requests for Quotation (RFQs)</p>
            </div>
            <Link
              to="/create-rfq"
              className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-brand-200 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" /> Create RFQ
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Total RFQs</span>
              <span className="block text-3xl font-extrabold text-slate-800 mt-1">{stats.total}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-brand-600 uppercase">Active Auctions</span>
              <span className="block text-3xl font-extrabold text-brand-600 mt-1">{stats.active}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Standard Closed</span>
              <span className="block text-3xl font-extrabold text-slate-500 mt-1">{stats.closed}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-red-600 uppercase">Force Closed</span>
              <span className="block text-3xl font-extrabold text-red-600 mt-1">{stats.forceClosed}</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search by RFQ name or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Closed">Closed Only</option>
                <option value="Force Closed">Force Closed Only</option>
              </select>
            </div>
          </div>

          {/* RFQs List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : filteredRfqs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <FolderMinus className="h-16 w-16 mx-auto mb-4 stroke-1" />
              <h3 className="text-lg font-bold text-slate-700">No RFQs Found</h3>
              <p className="text-sm mt-1">Start by publishing a new request for quotations.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase text-slate-500 tracking-wider">
                      <th className="px-6 py-4">RFQ Details</th>
                      <th className="px-6 py-4">Reference ID</th>
                      <th className="px-6 py-4">Lowest Bid (L1)</th>
                      <th className="px-6 py-4">Closing Time</th>
                      <th className="px-6 py-4">Forced Close</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRfqs.map((rfq) => (
                      <RfqRow key={rfq._id} rfq={rfq} token={token} navigate={navigate} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Row component to fetch dynamically lowest bid
const RfqRow = ({ rfq, token, navigate }) => {
  const [lowestBid, setLowestBid] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await axios.get(`${BIDDING_SERVICE_URL}/rank/${rfq._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data.length > 0) {
          setLowestBid(res.data.data[0].totalAmount);
        }
      } catch (err) {
        console.error('Error fetching rankings for row:', err.message);
      }
    };
    fetchRankings();
  }, [rfq._id, token]);

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-4">
        <span className="font-bold text-slate-800">{rfq.rfqName}</span>
        <span className="block text-[10px] text-slate-400 mt-0.5">
          Pickup: {new Date(rfq.pickupDate).toLocaleDateString()}
        </span>
      </td>
      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{rfq.referenceId}</td>
      <td className="px-6 py-4 font-extrabold text-slate-800">
        {lowestBid !== null ? (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <Award className="h-4 w-4" /> ${lowestBid.toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">No bids</span>
        )}
      </td>
      <td className="px-6 py-4 text-slate-600 font-medium">
        {new Date(rfq.bidCloseTime).toLocaleTimeString()}
        <span className="block text-[10px] text-slate-400 mt-0.5">
          {new Date(rfq.bidCloseTime).toLocaleDateString()}
        </span>
      </td>
      <td className="px-6 py-4 text-slate-600 font-medium">
        {new Date(rfq.forcedCloseTime).toLocaleTimeString()}
        <span className="block text-[10px] text-slate-400 mt-0.5">
          {new Date(rfq.forcedCloseTime).toLocaleDateString()}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
          rfq.status === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : rfq.status === 'Closed'
            ? 'bg-slate-100 text-slate-600 border border-slate-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {rfq.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => navigate(`/auction/${rfq._id}`)}
          className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 text-xs font-bold transition-all"
        >
          <Eye className="h-3.5 w-3.5" /> Monitor
        </button>
      </td>
    </tr>
  );
};

export default BuyerDashboard;
