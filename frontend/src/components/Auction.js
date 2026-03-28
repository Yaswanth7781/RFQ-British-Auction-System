import { useEffect, useState } from "react";
import io from "socket.io-client";
import API from "../services/api";

const socket = io("https://rfq-british-auction-system.onrender.com");

function Auction() {
  const [bids, setBids] = useState([]);
  const [price, setPrice] = useState("");
  const [rfqs, setRfqs] = useState([]);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");


  useEffect(() => {
    const fetchRFQs = async () => {
      const res = await API.get("/rfq");
      setRfqs(res.data);

      if (res.data.length > 0) {
        setSelectedRfq(res.data[0]);
      }
    };

    fetchRFQs();
  }, []);


  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedRfq) return;

      const now = new Date();
      const closeTime = new Date(selectedRfq.close_time);

      const diff = closeTime - now;

      if (diff <= 0) {
        setTimeLeft("Auction Expired");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedRfq]);

  useEffect(() => {
    if (!selectedRfq) return;

    const handleUpdate = (data) => {
      if (data.rfq_id === selectedRfq.id) {
        setBids(data.bids);
      }
    };

    socket.on("auction_update", handleUpdate);

    return () => {
      socket.off("auction_update", handleUpdate);
    };
  }, [selectedRfq]);

  const placeBid = async () => {
    if (!selectedRfq) return;

    if (timeLeft === "Auction Expired") {
      alert("Auction already expired!");
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

      {/* 🔥 Dropdown */}
      <select
        value={selectedRfq?.id || ""}
        onChange={(e) => {
          const rfq = rfqs.find(r => r.id === Number(e.target.value));
          setSelectedRfq(rfq);
          setBids([]);
        }}
      >
        {rfqs.map((rfq) => (
          <option key={rfq.id} value={rfq.id}>
            {rfq.name}
          </option>
        ))}
      </select>

      {/* 🔥 Show time */}
      {selectedRfq && (
        <p>
          ⏳ Time Left:{" "}
          <span style={{ color: timeLeft === "Auction Expired" ? "red" : "green" }}>
            {timeLeft}
          </span>
        </p>
      )}

      {/* 🔥 Expired message */}
      {timeLeft === "Auction Expired" && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          🚫 This auction is expired
        </p>
      )}

      <div className="input-group">
        <input
          placeholder="Enter price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button
          onClick={placeBid}
          disabled={timeLeft === "Auction Expired"}
        >
          Place Bid
        </button>
      </div>

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
