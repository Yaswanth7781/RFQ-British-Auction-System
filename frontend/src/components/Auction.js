import { useEffect, useState } from "react";
import io from "socket.io-client";
import API from "../services/api";

const socket = io("https://rfq-british-auction-system.onrender.com");

function Auction() {
  const [bids, setBids] = useState([]);
  const [price, setPrice] = useState("");
  const [rfqs, setRfqs] = useState([]);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [auctionClosed, setAuctionClosed] = useState(false);

  // 🔥 Fetch RFQs
  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const res = await API.get("/rfq");
        setRfqs(res.data);

        if (res.data.length > 0) {
          setSelectedRfq(res.data[0]);
        }
      } catch (err) {
        console.error("Error fetching RFQs:", err);
      }
    };

    fetchRFQs();
  }, []);

  // 🔥 Socket handling
  useEffect(() => {
    if (!selectedRfq) return;

    const handleUpdate = (data) => {
      if (data.rfq_id === selectedRfq.id) {
        setBids(data.bids);
      }
    };

    const handleClose = (data) => {
      if (data.rfq_id === selectedRfq.id) {
        setAuctionClosed(true);
        alert("Auction Closed!");
        socket.off("auction_closed", handleClose); // prevent repeat
      }
    };

    socket.on("auction_update", handleUpdate);
    socket.on("auction_closed", handleClose);

    return () => {
      socket.off("auction_update", handleUpdate);
      socket.off("auction_closed", handleClose);
    };
  }, [selectedRfq]);

  const placeBid = async () => {
    if (!selectedRfq) {
      alert("Please select an auction");
      return;
    }

    if (auctionClosed) {
      alert("Auction already closed!");
      return;
    }

    if (!price) {
      alert("Enter a valid price");
      return;
    }

    try {
      await API.post("/bid", {
        rfq_id: selectedRfq.id,
        supplier_id: 1,
        price: Number(price)
      });

      setPrice("");
    } catch (error) {
      console.error(error);
      alert("Failed to place bid.");
    }
  };

  return (
    <div className="card">
      <h2>Auction</h2>

      {/* 🔥 No RFQ case */}
      {rfqs.length === 0 && <p>No auctions available</p>}

      {/* 🔥 Dropdown */}
      {rfqs.length > 0 && (
        <select
          value={selectedRfq?.id || ""}
          onChange={(e) => {
            const rfq = rfqs.find(r => r.id === Number(e.target.value));
            setSelectedRfq(rfq);
            setAuctionClosed(false);
            setBids([]);
          }}
        >
          {rfqs.map((rfq) => (
            <option key={rfq.id} value={rfq.id}>
              {rfq.name} (ID: {rfq.id})
            </option>
          ))}
        </select>
      )}

      {/* 🔥 Bid input */}
      <div className="input-group">
        <input
          placeholder="Enter price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button onClick={placeBid} disabled={auctionClosed}>
          Place Bid
        </button>
      </div>

      {/* 🔥 Status */}
      {auctionClosed && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          Auction Closed
        </p>
      )}

      <h3>Bids</h3>

      {bids.length === 0 ? (
        <p>No bids yet.</p>
      ) : (
        bids.map((b, index) => (
          <p key={index}>
            L{index + 1} → Supplier {b.supplier_id} - ₹{b.price}
          </p>
        ))
      )}
    </div>
  );
}

export default Auction;
