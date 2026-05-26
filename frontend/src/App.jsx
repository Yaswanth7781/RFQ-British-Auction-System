import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerDashboard from './pages/BuyerDashboard';
import CreateRFQ from './pages/CreateRFQ';
import SellerDashboard from './pages/SellerDashboard';
import AuctionDetails from './pages/AuctionDetails';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login/buyer" element={<Login role="buyer" />} />
          <Route path="/login/seller" element={<Login role="seller" />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Buyer Routes */}
          <Route
            path="/buyer-dashboard"
            element={
              <ProtectedRoute allowedRole="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-rfq"
            element={
              <ProtectedRoute allowedRole="buyer">
                <CreateRFQ />
              </ProtectedRoute>
            }
          />

          {/* Protected Seller Routes */}
          <Route
            path="/seller-dashboard"
            element={
              <ProtectedRoute allowedRole="seller">
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Shared Bidding Arena */}
          <Route
            path="/auction/:id"
            element={
              <ProtectedRoute>
                <AuctionDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
