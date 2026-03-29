import { useEffect, useState } from "react";
import API from "../services/api";

function Auction() {
  const [rfqs, setRfqs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  // 🔥 Fetch RFQs
  useEffect(() => {
    const fetchRFQs = async () => {
      const res = await API.get("/rfq");
      setRfqs(res.data);
      setFiltered(res.data);

      if (res.data.length > 0) {
        setSelectedRfq(res.data[0]);
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

  // 🗑️ DELETE FUNCTION
  const deleteAuction = async () => {
    if (!selectedRfq) return;

    const confirmDelete = window.confirm("Delete this auction?");
    if (!confirmDelete) return;

    try {
      await API.delete(`/rfq/${selectedRfq.id}`);
      alert("Auction deleted!");
      window.location.reload();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="card">
      <h2>Auction</h2>

      {/* 🔍 SEARCH */}
      <input
        placeholder="Search auction..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "10px", width: "200px" }}
      />

      {/* 🔽 DROPDOWN */}
      <select
        value={selectedRfq?.id || ""}
        onChange={(e) => {
          const rfq = rfqs.find(r => r.id === Number(e.target.value));
          setSelectedRfq(rfq);
        }}
        style={{ marginLeft: "10px" }}
      >
        {filtered.map(rfq => (
          <option key={rfq.id} value={rfq.id}>
            {rfq.name}
          </option>
        ))}
      </select>

      {/* 🗑️ DELETE BUTTON */}
      <button
        onClick={deleteAuction}
        style={{
          backgroundColor: "red",
          color: "white",
          marginLeft: "10px",
          padding: "6px 10px",
          border: "none",
          cursor: "pointer"
        }}
      >
        Delete
      </button>

      {/* ⏳ TIMER */}
      {selectedRfq && (
        <div style={{ marginTop: "10px" }}>
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
    </div>
  );
}

export default Auction;
