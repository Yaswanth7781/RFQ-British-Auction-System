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
      await API.post("/rfq", form);
      alert("RFQ Created!");
      setForm({
        name: "",
        start_time: "",
        close_time: "",
        forced_close_time: "",
        trigger_window: 5,
        extension_duration: 5,
        trigger_type: "ANY_BID"
      });
    } catch (error) {
      console.error(error);
      alert("Failed to create RFQ.");
    }
  };

  return (
    <div className="card">
      <h2>Create RFQ</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Name
          <input
            value={form.name}
            placeholder="Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>

        <label>
          Start time
          <input
            type="datetime-local"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
          />
        </label>

        <label>
          Close time
          <input
            type="datetime-local"
            value={form.close_time}
            onChange={(e) => setForm({ ...form, close_time: e.target.value })}
          />
        </label>

        <label>
          Forced close time
          <input
            type="datetime-local"
            value={form.forced_close_time}
            onChange={(e) => setForm({ ...form, forced_close_time: e.target.value })}
          />
        </label>

        <label>
          Trigger window (minutes)
          <input
            type="number"
            min="0"
            value={form.trigger_window}
            onChange={(e) => setForm({ ...form, trigger_window: Number(e.target.value) })}
          />
        </label>

        <label>
          Extension duration (minutes)
          <input
            type="number"
            min="0"
            value={form.extension_duration}
            onChange={(e) => setForm({ ...form, extension_duration: Number(e.target.value) })}
          />
        </label>

        <button type="submit">Create</button>
      </form>
    </div>
  );
}

export default RFQForm;
