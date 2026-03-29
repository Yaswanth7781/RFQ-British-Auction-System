import { useEffect, useState } from "react";
import io from "socket.io-client";
import API from "../services/api";

const socket = io("https://rfq-british-auction-system.onrender.com");

function Auction() {
  const [rfqs, setRfqs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [bids, setBids] = useState([]);
  const [price, setPrice] = useState("");


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

  useEffect(() => {
    const filteredData = rfqs.filter(rfq =>
      rfq.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filteredData);
  }, [search, rfqs]);

 
  const deleteAuction = async () => {
    if (!selectedRfq) return;

    if (!window.confirm("Delete this auction?")) return;

    await API.delete(`/rfq/${selectedRfq.id}`);
    alert("Deleted");
    window.location.reload();
  };


  const placeBid = async () => {
    await API.post("/bid", {
      rfq_id: selectedRfq.id,
      supplier_id: 1,
      price: Number(price)
    });
    setPrice("");
  };

  return (
    <div className="card">
      <h2>Auction</h2>

     
      <input
        placeholder="Search auction..."
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
      />

      <select
        onChange={(e)=>{
          const rfq = rfqs.find(r=>r.id===Number(e.target.value));
          setSelectedRfq(rfq);
        }}
      >
        {filtered.map(rfq=>(
          <option key={rfq.id} value={rfq.id}>
            {rfq.name}
          </option>
        ))}
      </select>

      
      <button onClick={deleteAuction} style={{background:"red",color:"white"}}>
        Delete Auction
      </button>

   
      <input
        placeholder="Enter price"
        value={price}
        onChange={(e)=>setPrice(e.target.value)}
      />

      <button onClick={placeBid}>Place Bid</button>

      <h3>Bids</h3>
      {bids.length===0 ? <p>No bids</p> :
        bids.map((b,i)=>(
          <p key={i}>L{i+1} → ₹{b.price}</p>
        ))
      }
    </div>
  );
}

export default Auction;
