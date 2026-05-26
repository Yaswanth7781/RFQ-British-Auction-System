import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { ChevronLeft, ShieldAlert, Award, Calendar, DollarSign, Clock, Download, Plus, Landmark, BarChart2 } from 'lucide-react';
import axios from 'axios';

const RFQ_SERVICE_URL = 'http://localhost:5002/api/rfq';
const BIDDING_SERVICE_URL = 'http://localhost:5003/api/bid';
const NOTIFICATION_SERVICE_URL = 'http://localhost:5004/api';

const AuctionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [rfq, setRfq] = useState(null);
  const [config, setConfig] = useState(null);
  const [bids, setBids] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Bidding form states (for sellers)
  const [freightCharges, setFreightCharges] = useState('');
  const [originCharges, setOriginCharges] = useState('');
  const [destinationCharges, setDestinationCharges] = useState('');
  const [transitTime, setTransitTime] = useState('');
  const [validity, setValidity] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)); // Default validity 2 weeks out
  const [bidSubmitLoading, setBidSubmitLoading] = useState(false);

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState('');
  const [forcedTimeLeft, setForcedTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  const isSeller = user?.role === 'seller';
  const currentSellerId = user?._id || user?.id;

  const fetchAuctionData = async () => {
    try {
      // 1. Fetch RFQ & Config
      const rfqRes = await axios.get(`${RFQ_SERVICE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (rfqRes.data.success) {
        setRfq(rfqRes.data.data.rfq);
        setConfig(rfqRes.data.data.config);
      }

      // 2. Fetch Bids
      const bidsRes = await axios.get(`${BIDDING_SERVICE_URL}/list/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (bidsRes.data.success) {
        setBids(bidsRes.data.data);
      }

      // 3. Fetch Rankings
      const rankRes = await axios.get(`${BIDDING_SERVICE_URL}/rank/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (rankRes.data.success) {
        setRankings(rankRes.data.data);
      }

      // 4. Fetch Activity Logs
      const logsRes = await axios.get(`${NOTIFICATION_SERVICE_URL}/activity/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (logsRes.data.success) {
        setActivityLogs(logsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve auction parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionData();
    // Poll data every 4 seconds for real-time bid monitoring / rankings updates!
    const interval = setInterval(fetchAuctionData, 4000);
    return () => clearInterval(interval);
  }, [id, token]);

  // Live Timer Effect
  useEffect(() => {
    if (!rfq) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const closeTime = new Date(rfq.bidCloseTime).getTime();
      const forcedTime = new Date(rfq.forcedCloseTime).getTime();

      const formatTime = (diff) => {
        if (diff <= 0) return '00:00:00';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      };

      const distClose = closeTime - now;
      const distForced = forcedTime - now;

      setTimeLeft(formatTime(distClose));
      setForcedTimeLeft(formatTime(distForced));

      if (distClose <= 0 || rfq.status !== 'Active') {
        setIsExpired(true);
      } else {
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [rfq]);

  // Submit Quote Handler
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setBidSubmitLoading(true);

    try {
      const res = await axios.post(`${BIDDING_SERVICE_URL}/create`, {
        rfqId: id,
        freightCharges: Number(freightCharges),
        originCharges: Number(originCharges),
        destinationCharges: Number(destinationCharges),
        transitTime: Number(transitTime),
        validity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Bid submitted successfully!');
        if (res.data.data.rfqExtended) {
          setSuccessMsg(`Bid submitted and Auction extended! New Close: ${new Date(res.data.data.newCloseTime).toLocaleTimeString()}`);
        }
        // Reset inputs
        setFreightCharges('');
        setOriginCharges('');
        setDestinationCharges('');
        setTransitTime('');
        fetchAuctionData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quote');
    } finally {
      setBidSubmitLoading(false);
    }
  };

  // Export to CSV Function
  const exportToCSV = () => {
    if (!bids.length) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Bid ID,Supplier Name,Freight Charges ($),Origin Charges ($),Destination Charges ($),Total Amount ($),Transit Time (Days),Validity Date,Submitted At\n';

    bids.forEach((b) => {
      csvContent += `${b._id},${b.sellerName},${b.freightCharges},${b.originCharges},${b.destinationCharges},${b.totalAmount},${b.transitTime},"${new Date(b.validity).toLocaleDateString()}","${new Date(b.createdAt).toLocaleString()}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RFQ_${rfq?.referenceId}_bids_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <ShieldAlert className="h-16 w-16 text-red-500 stroke-1 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Auction RFQ Not Found</h3>
        <button
          onClick={() => navigate(isSeller ? '/seller-dashboard' : '/buyer-dashboard')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold"
        >
          Return to Console
        </button>
      </div>
    );
  }

  // Calculated totals for form
  const formTotal = (Number(freightCharges) || 0) + (Number(originCharges) || 0) + (Number(destinationCharges) || 0);

  // Find current seller's lowest quote
  const sellerStanding = rankings.find(r => r.sellerId.toString() === currentSellerId?.toString());
  const myLowestQuote = sellerStanding ? sellerStanding.totalAmount : null;

  // Max bid for charting scale
  const maxBidTotal = rankings.length > 0 ? Math.max(...rankings.map(r => r.totalAmount)) : 1000;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Back btn */}
          <button
            onClick={() => navigate(isSeller ? '/seller-dashboard' : '/buyer-dashboard')}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>

          {/* Auction Overview Header */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">{rfq.referenceId}</span>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{rfq.rfqName}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    rfq.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                      : rfq.status === 'Closed'
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {rfq.status}
                  </span>
                  <button
                    onClick={exportToCSV}
                    disabled={bids.length === 0}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" /> CSV Report
                  </button>
                </div>
              </div>

              {/* Configurations Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium border-t border-slate-100 pt-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold mb-1">Target Pickup Date</span>
                  <span className="text-slate-800 font-bold flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-brand-500" /> {new Date(rfq.pickupDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold mb-1">Extension Trigger Policy</span>
                  <span className="text-slate-800 font-bold flex items-center gap-1">
                    <Landmark className="h-3.5 w-3.5 text-brand-500" /> {config?.triggerType}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold mb-1">Trigger Window</span>
                  <span className="text-slate-800 font-bold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-brand-500" /> Last {config?.triggerWindow} mins
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-semibold mb-1">Extension Duration</span>
                  <span className="text-slate-800 font-bold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-brand-500" /> + {config?.extensionDuration} mins
                  </span>
                </div>
              </div>
            </div>

            {/* Timers & Countdown Panel */}
            <div className="w-full lg:w-80 bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Time Left to Close</span>
                <div className="text-4xl font-black text-white tracking-widest font-mono select-none">
                  {timeLeft}
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Close Time: {new Date(rfq.bidCloseTime).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="border-t border-slate-800 pt-4 mt-4">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Forced Absolute End</span>
                <div className="text-xl font-bold text-red-400 tracking-wider font-mono">
                  {forcedTimeLeft}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Hard Limit: {new Date(rfq.forcedCloseTime).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Messages Alert */}
          {(error || successMsg) && (
            <div className="mb-6 space-y-2">
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <Award className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Grid Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column (Rankings, Submissions, Bids list) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Supplier Rankings Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-brand-600" /> Supplier Standings & Rankings
                </h3>
                {rankings.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    No quotations submitted yet. Standings will generate on first bid.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {rankings.map((rank, index) => {
                      const isL1 = index === 0;
                      const isCurrentUser = rank.sellerId.toString() === currentSellerId?.toString();
                      return (
                        <div
                          key={rank.sellerId}
                          className={`relative border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                            isL1
                              ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/10'
                              : isCurrentUser
                              ? 'bg-blue-50/30 border-blue-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          {isL1 && (
                            <span className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                              <Award className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${
                              isL1
                                ? 'bg-emerald-600 text-white font-extrabold'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              Rank L{rank.rank}
                            </span>
                            <h4 className="text-sm font-bold text-slate-800 truncate">
                              {rank.sellerName} {isCurrentUser && <span className="text-brand-600 font-semibold">(You)</span>}
                            </h4>
                          </div>
                          <div className="mt-4">
                            <span className="text-[10px] text-slate-400 block font-semibold">Total Price Quotation</span>
                            <span className={`text-xl font-black ${isL1 ? 'text-emerald-600' : 'text-slate-800'}`}>
                              ${rank.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Bid Comparison Chart */}
              {rankings.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-brand-600" /> Bids Comparison Graph
                  </h3>
                  <div className="space-y-3 pt-2">
                    {rankings.map((rank, index) => {
                      const percent = (rank.totalAmount / maxBidTotal) * 100;
                      const isCurrentUser = rank.sellerId.toString() === currentSellerId?.toString();
                      return (
                        <div key={rank.sellerId} className="flex items-center gap-4 text-xs">
                          <div className="w-28 font-bold text-slate-700 truncate">
                            L{rank.rank} - {rank.sellerName} {isCurrentUser && '(You)'}
                          </div>
                          <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative border border-slate-200/40">
                            <div
                              className={`h-full rounded-full transition-all duration-500 flex items-center justify-end px-2 ${
                                index === 0 ? 'bg-emerald-500' : isCurrentUser ? 'bg-brand-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${percent}%` }}
                            >
                              {percent > 20 && (
                                <span className="text-[9px] font-bold text-white tracking-wider font-mono">
                                  ${rank.totalAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {percent <= 20 && (
                            <div className="font-extrabold text-slate-700 font-mono">
                              ${rank.totalAmount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bid Submission Panel for Supplier */}
              {isSeller && rfq.status === 'Active' && !isExpired && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-brand-600" /> Submit Quote Proposal
                  </h3>
                  {myLowestQuote !== null && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-4 leading-relaxed">
                      * Price Reduction Rule active. Your new bid must be strictly LESS than your current best quote of <span className="font-black font-mono text-sm">${myLowestQuote.toLocaleString()}</span>.
                    </div>
                  )}

                  <form onSubmit={handleBidSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Freight Charges ($)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={freightCharges}
                          onChange={(e) => setFreightCharges(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Origin Charges ($)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={originCharges}
                          onChange={(e) => setOriginCharges(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destination Charges ($)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={destinationCharges}
                          onChange={(e) => setDestinationCharges(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transit Time (Days)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={transitTime}
                          onChange={(e) => setTransitTime(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bid Validity Date</label>
                        <input
                          type="date"
                          required
                          value={validity}
                          onChange={(e) => setValidity(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Auto Calculation Panel */}
                    <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Projected Quote Total</span>
                        <span className="text-xs text-slate-500">Auto calculated on inputs</span>
                      </div>
                      <div className="text-2xl font-black text-brand-400 font-mono">
                        ${formTotal.toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={bidSubmitLoading || formTotal <= 0}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-100 transition-all flex justify-center items-center gap-2"
                    >
                      {bidSubmitLoading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      ) : (
                        'Submit Quotation Bid'
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Historical Bids Listing */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">RFQ Quotation Log</h3>
                {bids.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    No bids have been logged for this RFQ.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 font-bold text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Supplier Name</th>
                          <th className="px-4 py-3">Freight</th>
                          <th className="px-4 py-3">Origin</th>
                          <th className="px-4 py-3">Destination</th>
                          <th className="px-4 py-3">Total Quote</th>
                          <th className="px-4 py-3">Transit</th>
                          <th className="px-4 py-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {bids.map((b) => (
                          <tr key={b._id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-slate-800">{b.sellerName}</td>
                            <td className="px-4 py-3">${b.freightCharges.toLocaleString()}</td>
                            <td className="px-4 py-3">${b.originCharges.toLocaleString()}</td>
                            <td className="px-4 py-3">${b.destinationCharges.toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">${b.totalAmount.toLocaleString()}</td>
                            <td className="px-4 py-3 font-medium">{b.transitTime} days</td>
                            <td className="px-4 py-3 text-slate-400">{new Date(b.createdAt).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column (Activity Log and System Audit Feed) */}
            <div className="space-y-6">
              
              {/* System Audit Feed */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                  RFQ Activity & Extension Feed
                </h3>
                {activityLogs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    No activity logs recorded.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-6">
                    {activityLogs.map((log) => {
                      const isExt = log.actionType === 'Extension';
                      const isBid = log.actionType === 'Bid Placed';
                      const isCreate = log.actionType === 'Creation';
                      const isStatus = log.actionType === 'Status Change';
                      
                      return (
                        <div key={log._id} className="relative text-xs">
                          {/* Dot indicator */}
                          <span className={`absolute -left-[22px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-white ${
                            isExt
                              ? 'bg-amber-500'
                              : isBid
                              ? 'bg-blue-500'
                              : isCreate
                              ? 'bg-emerald-500'
                              : 'bg-slate-500'
                          }`} />
                          
                          <div className="flex items-center justify-between mb-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              isExt
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : isBid
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : isCreate
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {log.actionType}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium leading-relaxed">{log.description}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AuctionDetails;
