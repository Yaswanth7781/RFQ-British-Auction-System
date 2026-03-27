import { useEffect, useState } from "react";
import io from "socket.io-client";
import API from "../services/api";

const socket = io("http://localhost:5000");

function Auction() {
  const [bids, setBids] = useState([]);
  const [price, setPrice] = useState("");
  const [rfqId, setRfqId] = useState(1);

  useEffect(() => {
    socket.on("auction_update", (data) => {
      setBids(data.bids);
    });

    socket.on("auction_closed", () => {
      alert("Auction Closed!");
    });

    return () => {
      socket.off("auction_update");
      socket.off("auction_closed");
    };
  }, []);

  const placeBid = async () => {
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
        <button onClick={placeBid}>Place Bid</button>
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
