import { useEffect, useState } from "react";
import API from "../services/api";

function Auction() {
  const [rfqs, setRfqs] = useState([]);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  // 🔥 fetch auctions
  useEffect(() => {
    const fetch = async () => {
      const res = await API.get("/rfq");
      setRfqs(res.data);

      if (res.data.length > 0) {
        setSelectedRfq(res.data[0]);
      }
    };
    fetch();
  }, []);

  // 🔥 countdown timer
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
        const s = Math.floor((diff % 60000)/1000);
        setTimeLeft(`${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedRfq]);

  return (
    <div className="card">
      <h2>Auction</h2>

      {/* dropdown */}
      <select
        onChange={(e)=>{
          const rfq = rfqs.find(r=>r.id===Number(e.target.value));
          setSelectedRfq(rfq);
        }}
      >
        {rfqs.map(r=>(
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {/* time display */}
      {selectedRfq && (
        <div style={{marginTop:"10px"}}>
          <p>
            ⏳ Time Left:{" "}
            <b style={{color: timeLeft==="EXPIRED"?"red":"green"}}>
              {timeLeft}
            </b>
          </p>

          {timeLeft==="EXPIRED" && (
            <p style={{color:"red",fontWeight:"bold"}}>
              🚫 Auction is Expired
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Auction;
