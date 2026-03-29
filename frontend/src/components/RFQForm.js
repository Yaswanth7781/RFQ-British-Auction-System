import { useState } from "react";
import API from "../services/api";

function RFQForm() {
  const [form, setForm] = useState({
    name: "",
    start_time: "",
    close_time: "",
    forced_close_time: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        close_time: new Date(form.close_time).toISOString(),
        forced_close_time: new Date(form.forced_close_time).toISOString()
      };

      await API.post("/rfq", payload);

      alert("RFQ Created!");
      window.location.reload();

    } catch (err) {
      alert(err.response?.data?.error || "Error");
    }
  };

  return (
    <div className="card">
      <h2>Create RFQ</h2>

      <form onSubmit={handleSubmit} className="form-grid">

        <label>
          RFQ Name
          <input
            placeholder="Enter name"
            value={form.name}
            onChange={(e)=>setForm({...form,name:e.target.value})}
          />
        </label>

        <label>
          Start Time
          <input
            type="datetime-local"
            onChange={(e)=>setForm({...form,start_time:e.target.value})}
          />
        </label>

        <label>
          Close Time
          <input
            type="datetime-local"
            onChange={(e)=>setForm({...form,close_time:e.target.value})}
          />
        </label>

        <label>
          Forced Close Time
          <input
            type="datetime-local"
            onChange={(e)=>setForm({...form,forced_close_time:e.target.value})}
          />
        </label>

        <button type="submit">Create Auction</button>
      </form>
    </div>
  );
}

export default RFQForm;
