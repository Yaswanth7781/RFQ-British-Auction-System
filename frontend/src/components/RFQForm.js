import { useState } from "react";
import API from "../services/api";

function RFQForm() {
  const [form, setForm] = useState({
    name: "",
    start_time: "",
    close_time: "",
    forced_close_time: "",
    trigger_window: 5,
    extension_duration: 5,
    trigger_type: "ANY_BID"
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

    } catch (error) {
      alert(error.response?.data?.error || "Failed to create RFQ");
    }
  };

  return (
    <div className="card">
      <h2>Create RFQ</h2>

      <form onSubmit={handleSubmit}>
        <input placeholder="Name"
          onChange={(e)=>setForm({...form,name:e.target.value})} />

        <input type="datetime-local"
          onChange={(e)=>setForm({...form,start_time:e.target.value})} />

        <input type="datetime-local"
          onChange={(e)=>setForm({...form,close_time:e.target.value})} />

        <input type="datetime-local"
          onChange={(e)=>setForm({...form,forced_close_time:e.target.value})} />

        <button type="submit">Create</button>
      </form>
    </div>
  );
}

export default RFQForm;
