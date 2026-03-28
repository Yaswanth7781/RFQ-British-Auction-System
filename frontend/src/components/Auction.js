import { useEffect, useState } from "react";
import io from "socket.io-client";
import API from "../services/api";

const socket = io("https://rfq-british-auction-system.onrender.com");

function Auction() {
  const [bids, setBids] = useState([]);
  const [price, setPrice] = useState("");
  const [rfqId, setRfqId] = useState(1);
  const [auctionClosed, setAuctionClosed] = useState(false);

  useEffect(() => {
    
    socket.on("auction_update", (data) => {
      setBids(data.bids);
    });
    const handleClose = (data) => {
      if (data.rfq_id === rfqId) {
        setAuctionClosed(true);
        alert("Auction Closed!");
        socket.off("auction_closed", handleClose); 
      }
    };

    socket.on("auction_closed", handleClose);

    return () => {
      socket.off("auction_update");
      socket.off("auction_closed", handleClose);
    };
  }, [rfqId]);

  const placeBid = async () => {
    if (auctionClosed) {
      alert("Auction already closed!");
      return;
    }

    try {
      await API.post("/bid", {
        rfq_id: rfqId,
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

      <div className="input-group">
        <input
          placeholder="RFQ ID"
          type="number"
          value={rfqId}
          onChange={(e) => setRfqId(Number(e.target.value))}
        />

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

      {/* Show status */}
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
