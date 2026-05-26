import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Save, RefreshCw, ChevronLeft, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const RFQ_SERVICE_URL = 'http://localhost:5002/api/rfq';

const CreateRFQ = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const generateRefId = () => `RFQ-${Math.floor(100000 + Math.random() * 900000)}`;

  const [rfqName, setRfqName] = useState('');
  const [referenceId, setReferenceId] = useState(generateRefId());
  
  // Set default times to make testing easy
  const getFutureTime = (minutes) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    // Format to yyyy-MM-ddThh:mm for datetime-local inputs
    return d.toISOString().slice(0, 16);
  };

  const [bidStartTime, setBidStartTime] = useState(getFutureTime(0));
  const [bidCloseTime, setBidCloseTime] = useState(getFutureTime(15)); // Closes in 15 mins
  const [forcedCloseTime, setForcedCloseTime] = useState(getFutureTime(30)); // Capped at 30 mins
  const [pickupDate, setPickupDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)); // 1 week out
  
  const [triggerWindow, setTriggerWindow] = useState(5); // 5 mins
  const [extensionDuration, setExtensionDuration] = useState(5); // 5 mins
  const [triggerType, setTriggerType] = useState('Bid Received');
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegenRef = () => {
    setReferenceId(generateRefId());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const start = new Date(bidStartTime);
    const close = new Date(bidCloseTime);
    const forced = new Date(forcedCloseTime);

    if (close <= start) {
      setError('Bid Close Time must be after Bid Start Time');
      setLoading(false);
      return;
    }

    if (forced <= close) {
      setError('Forced Close Time must be after Bid Close Time');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${RFQ_SERVICE_URL}/create`, {
        rfqName,
        referenceId,
        bidStartTime,
        bidCloseTime,
        forcedCloseTime,
        pickupDate,
        triggerWindow: Number(triggerWindow),
        extensionDuration: Number(extensionDuration),
        triggerType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        navigate('/buyer-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-4xl">
          <button
            onClick={() => navigate('/buyer-dashboard')}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Create Request for Quotation</h2>
            <p className="text-xs text-slate-400 mt-1">Configure RFQ parameters and dynamic British Auction policies</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold mb-6">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: General RFQ Information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">General Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RFQ Name</label>
                  <input
                    type="text"
                    required
                    value={rfqName}
                    onChange={(e) => setRfqName(e.target.value)}
                    placeholder="e.g. Freight Route London - Berlin"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reference ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      readOnly
                      value={referenceId}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl text-sm font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleRegenRef}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                      title="Regenerate ID"
                    >
                      <RefreshCw className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Pickup Date</label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-full md:w-1/2"
                />
              </div>
            </div>

            {/* Section 2: Timeline Schedule */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Bidding Timeline</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bid Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={bidStartTime}
                    onChange={(e) => setBidStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bid Close Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={bidCloseTime}
                    onChange={(e) => setBidCloseTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Forced Close Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={forcedCloseTime}
                    onChange={(e) => setForcedCloseTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block leading-tight">
                    * Bidding terminates unconditionally at this hour.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: British Auction Extension Config */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">British Auction Extension Logic</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trigger Window (Minutes)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={triggerWindow}
                    onChange={(e) => setTriggerWindow(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Monitor bids near closing time.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Extension Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={extensionDuration}
                    onChange={(e) => setExtensionDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Extension added to close time.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trigger Type</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-medium"
                  >
                    <option value="Bid Received">Bid Received</option>
                    <option value="Any Rank Change">Any Rank Change</option>
                    <option value="Lowest Bidder Change">Lowest Bidder (L1) Change</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Condition to trigger extension.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Creating...' : 'Publish Auction RFQ'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/buyer-dashboard')}
                className="py-3 px-6 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateRFQ;
