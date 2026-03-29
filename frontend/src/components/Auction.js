import { useEffect, useState } from "react";
import API from "../services/api";

function Auction() {
  const [rfqs, setRfqs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [price, setPrice] = useState("");

  // 🔥 Fetch RFQs
  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const res = await API.get("/rfq");
        setRfqs(res.data);
        setFiltered(res.data);

        if (res.data.length > 0) {
          setSelectedRfq(res.data[0]);
        }
      } catch (err) {
        console.error("Error fetching RFQs:", err);
      }
    };
    fetchRFQs();
  }, []);

  // 🔍 SEARCH FILTER
  useEffect(() => {
    const filteredData = rfqs.filter(rfq =>
      rfq.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filteredData);
  }, [search, rfqs]);

  // ⏳ TIMER
  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedRfq) return;

      const now = new Date();
      const close = new Date(selectedRfq.close_time);

      const diff = close - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedRfq]);

  // 🗑️ DELETE
  const deleteAuction = async () => {
    if (!selectedRfq) return;

    if (!window.confirm("Delete this auction?")) return;

    try {
      await API.delete(`/rfq/${selectedRfq.id}`);
      alert("Auction deleted!");
      window.location.reload();
    } catch (err) {
      alert("Delete failed");
    }
  };

  // 💰 PLACE BID
  const placeBid = async () => {
    if (!selectedRfq) return;

    if (timeLeft === "EXPIRED") {
      alert("Auction expired!");
      return;
    }

    if (!price) {
      alert("Enter price");
      return;
    }

    try {
      await API.post("/bid", {
        rfq_id: selectedRfq.id,
        supplier_id: 1,
        price: Number(price)
      });

      alert("Bid placed!");
      setPrice("");
    } catch (err) {
      console.error(err);
      alert("Failed to place bid");
    }
  };

  return (
    <div className="card">
      <h2>Auction</h2>

      {/* 🔥 TOP BAR */}
      <div style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        marginBottom: "15px"
      }}>
        <input
          placeholder="Search auction..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px", width: "180px" }}
        />

        <select
          value={selectedRfq?.id || ""}
          onChange={(e) => {
            const rfq = rfqs.find(r => r.id === Number(e.target.value));
            setSelectedRfq(rfq);
          }}
          style={{ padding: "8px" }}
        >
          {filtered.length === 0 && <option>No auctions</option>}
          {filtered.map(rfq => (
            <option key={rfq.id} value={rfq.id}>
              {rfq.name}
            </option>
          ))}
        </select>

        <button
          onClick={deleteAuction}
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "8px 12px",
            border: "none",
            borderRadius: "5px"
          }}
        >
          Delete
        </button>
      </div>

      {/* ⚙️ CONFIG */}
      {selectedRfq && (
        <div style={{ marginBottom: "10px" }}>
          <p>⚙️ Trigger Window: <b>{selectedRfq.trigger_window} min</b></p>
          <p>⏱ Extension Duration: <b>{selectedRfq.extension_duration} min</b></p>
        </div>
      )}

      {/* ⏳ TIMER */}
      {selectedRfq && (
        <div style={{ marginBottom: "15px" }}>
          <p>
            ⏳ Time Left:{" "}
            <span style={{ color: timeLeft === "EXPIRED" ? "red" : "green" }}>
              {timeLeft}
            </span>
          </p>

          {timeLeft === "EXPIRED" && (
            <p style={{ color: "red", fontWeight: "bold" }}>
              🚫 Auction is Expired
            </p>
          )}
        </div>
      )}

      {/* 💰 BID SECTION (VISIBLE ALWAYS WHEN RFQ EXISTS) */}
      {selectedRfq && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            placeholder="Enter price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={timeLeft === "EXPIRED"}
            style={{ padding: "8px" }}
          />

          <button
            onClick={placeBid}
            disabled={timeLeft === "EXPIRED"}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "8px 12px",
              border: "none",
              borderRadius: "5px"
            }}
          >
            Place Bid
          </button>
        </div>
      )}

      {/* 📊 EMPTY STATE */}
      {rfqs.length === 0 && (
        <p>No auctions available</p>
      )}
    </div>
  );
}

export default Auction;
