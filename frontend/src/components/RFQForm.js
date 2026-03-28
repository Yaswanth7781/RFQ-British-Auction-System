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

    // 🔥 Validation
    if (!form.name || !form.start_time || !form.close_time || !form.forced_close_time) {
      alert("Please fill all fields");
      return;
    }

    if (new Date(form.close_time) <= new Date(form.start_time)) {
      alert("Close time must be after start time");
      return;
    }

    if (new Date(form.forced_close_time) <= new Date(form.close_time)) {
      alert("Forced close must be after close time");
      return;
    }

    try {
      // 🔥 Convert to ISO format (IMPORTANT)
      const payload = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        close_time: new Date(form.close_time).toISOString(),
        forced_close_time: new Date(form.forced_close_time).toISOString()
      };

      await API.post("/rfq", payload);

      alert("RFQ Created Successfully!");

      // 🔥 Reset form
      setForm({
        name: "",
        start_time: "",
        close_time: "",
        forced_close_time: "",
        trigger_window: 5,
        extension_duration: 5,
        trigger_type: "ANY_BID"
      });

      // 🔥 REFRESH UI (IMPORTANT FIX)
      window.location.reload();

    } catch (error) {
      console.error("RFQ creation error:", error);
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
            placeholder="Enter RFQ name"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </label>

        <label>
          Start time
          <input
            type="datetime-local"
            value={form.start_time}
            onChange={(e) =>
              setForm({ ...form, start_time: e.target.value })
            }
          />
        </label>

        <label>
          Close time
          <input
            type="datetime-local"
            value={form.close_time}
            onChange={(e) =>
              setForm({ ...form, close_time: e.target.value })
            }
          />
        </label>

        <label>
          Forced close time
          <input
            type="datetime-local"
            value={form.forced_close_time}
            onChange={(e) =>
              setForm({ ...form, forced_close_time: e.target.value })
            }
          />
        </label>

        <label>
          Trigger window (minutes)
          <input
            type="number"
            min="0"
            value={form.trigger_window}
            onChange={(e) =>
              setForm({ ...form, trigger_window: Number(e.target.value) })
            }
          />
        </label>

        <label>
          Extension duration (minutes)
          <input
            type="number"
            min="0"
            value={form.extension_duration}
            onChange={(e) =>
              setForm({ ...form, extension_duration: Number(e.target.value) })
            }
          />
        </label>

        <button type="submit">Create</button>
      </form>
    </div>
  );
}

export default RFQForm;
