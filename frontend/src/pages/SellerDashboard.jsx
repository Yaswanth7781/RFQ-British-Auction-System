import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Search, Eye, Filter, ShieldAlert, Award, FolderMinus } from 'lucide-react';
import axios from 'axios';

const RFQ_SERVICE_URL = 'http://localhost:5002/api/rfq';
const BIDDING_SERVICE_URL = 'http://localhost:5003/api/bid';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active'); // Default to show Active RFQs

  const fetchRFQs = async () => {
    try {
      const res = await axios.get(`${RFQ_SERVICE_URL}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRfqs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching RFQs for seller:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
    // Poll list every 15 seconds
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
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Supplier Auction Arena</h2>
              <p className="text-xs text-slate-400 mt-1">Submit quotes, track rankings, and participate in reverse auctions</p>
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
                <option value="Active">Active Auctions</option>
                <option value="Closed">Closed Auctions</option>
                <option value="Force Closed">Force Closed Auctions</option>
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
              <h3 className="text-lg font-bold text-slate-700">No Auctions Found</h3>
              <p className="text-sm mt-1">There are no matching RFQ opportunities at this moment.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase text-slate-500 tracking-wider">
                      <th className="px-6 py-4">RFQ Details</th>
                      <th className="px-6 py-4">Reference ID</th>
                      <th className="px-6 py-4">Current L1 Bid</th>
                      <th className="px-6 py-4">My Best Bid</th>
                      <th className="px-6 py-4">My Current Standing</th>
                      <th className="px-6 py-4">Closing Time</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRfqs.map((rfq) => (
                      <SellerRfqRow
                        key={rfq._id}
                        rfq={rfq}
                        token={token}
                        currentSellerId={user?._id || user?.id}
                        navigate={navigate}
                      />
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

// Row component to fetch rankings and lowest bids
const SellerRfqRow = ({ rfq, token, currentSellerId, navigate }) => {
  const [lowestBid, setLowestBid] = useState(null);
  const [myBestBid, setMyBestBid] = useState(null);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await axios.get(`${BIDDING_SERVICE_URL}/rank/${rfq._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const ranks = res.data.data;
          if (ranks.length > 0) {
            setLowestBid(ranks[0].totalAmount);
            
            // Find my rank
            const myStanding = ranks.find(r => r.sellerId.toString() === currentSellerId?.toString());
            if (myStanding) {
              setMyRank(myStanding.rank);
              setMyBestBid(myStanding.totalAmount);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching rankings for seller row:', err.message);
      }
    };
    fetchRankings();
  }, [rfq._id, token, currentSellerId]);

  const isActive = rfq.status === 'Active';

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-4">
        <span className="font-bold text-slate-800">{rfq.rfqName}</span>
        <span className="block text-[10px] text-slate-400 mt-0.5">
          Pickup: {new Date(rfq.pickupDate).toLocaleDateString()}
        </span>
      </td>
      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{rfq.referenceId}</td>
      <td className="px-6 py-4 font-bold text-slate-800">
        {lowestBid !== null ? (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <Award className="h-4 w-4" /> ${lowestBid.toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">No bids</span>
        )}
      </td>
      <td className="px-6 py-4 font-bold text-slate-700">
        {myBestBid !== null ? (
          `$${myBestBid.toLocaleString()}`
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        {myRank !== null ? (
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${
            myRank === 1
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : myRank === 2
              ? 'bg-blue-100 text-blue-800 border border-blue-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            L{myRank}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">Not Entered</span>
        )}
      </td>
      <td className="px-6 py-4 text-slate-600 font-medium">
        {new Date(rfq.bidCloseTime).toLocaleTimeString()}
        <span className="block text-[10px] text-slate-400 mt-0.5">
          {new Date(rfq.bidCloseTime).toLocaleDateString()}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
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
          className={`inline-flex items-center justify-center py-1.5 px-3 rounded-lg text-xs font-bold shadow-sm transition-all ${
            isActive
              ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-100'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          {isActive ? 'Enter Arena' : 'View Details'}
        </button>
      </td>
    </tr>
  );
};

export default SellerDashboard;
