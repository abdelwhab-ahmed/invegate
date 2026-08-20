"use client";
import { useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function pad(n) {
  return String(n).padStart(2, "0");
}

// Turns "10:00:00" or "10:00" into { h: 10, m: 0 }
function parseTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map((v) => parseInt(v, 10));
  return { h, m };
}

// Builds 30-minute increment slots between open_time and close_time, e.g. ["10:00", "10:30", ...]
function buildTimeSlots(openTime, closeTime) {
  const open = parseTime(openTime);
  const close = parseTime(closeTime);
  if (!open || !close) return [];

  const slots = [];
  let cursorMinutes = open.h * 60 + open.m;
  const endMinutes = close.h * 60 + close.m;

  while (cursorMinutes < endMinutes) {
    const h = Math.floor(cursorMinutes / 60);
    const m = cursorMinutes % 60;
    slots.push(`${pad(h)}:${pad(m)}`);
    cursorMinutes += 30;
  }
  return slots;
}

function formatSlotLabel(slot) {
  const [h, m] = slot.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${period}`;
}

export default function MeetingRequestForm({ landId, landTitle, officeSchedule, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "" });
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const openDaysSet = useMemo(() => {
    const set = new Set();
    (officeSchedule ?? []).forEach((row) => {
      if (row.is_open) set.add(row.day_of_week);
    });
    return set;
  }, [officeSchedule]);

  const scheduleForSelectedDate = useMemo(() => {
    if (!form.date) return null;
    const dow = new Date(`${form.date}T00:00:00`).getDay();
    return (officeSchedule ?? []).find((row) => row.day_of_week === dow) ?? null;
  }, [form.date, officeSchedule]);

  const timeSlots = useMemo(() => {
    if (!scheduleForSelectedDate || !scheduleForSelectedDate.is_open) return [];
    return buildTimeSlots(scheduleForSelectedDate.open_time, scheduleForSelectedDate.close_time);
  }, [scheduleForSelectedDate]);

  function handleDateChange(value) {
    setForm((f) => ({ ...f, date: value, time: "" }));
    if (!value) {
      setDateError("");
      return;
    }
    const dow = new Date(`${value}T00:00:00`).getDay();
    if (!openDaysSet.has(dow)) {
      setDateError("The office is closed on this day. Please select another date.");
    } else {
      setDateError("");
    }
  }

  const isValidSelection =
    form.date &&
    form.time &&
    !dateError &&
    scheduleForSelectedDate?.is_open;

  async function handleSubmit() {
    if (!form.name || !form.phone || !isValidSelection) return;
    setLoading(true);
    setError(null);

    try {
      const [h, m] = form.time.split(":").map(Number);
      const combined = new Date(`${form.date}T00:00:00`);
      combined.setHours(h, m, 0, 0);

      const { error: insertError } = await supabase.from("meeting_requests").insert({
        land_id: landId,
        full_name: form.name,
        phone: form.phone,
        requested_datetime: combined.toISOString(),
        status: "pending",
      });

      if (insertError) throw new Error("Failed to submit meeting request: " + insertError.message);

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    background: "#2C2C2E",
    border: "0.5px solid rgba(201,151,58,0.2)",
    borderRadius: 8,
    padding: "11px 14px",
    fontSize: 13,
    color: "#F0EDE6",
    fontFamily: "Inter, Arial, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#6B6762",
    marginBottom: 6,
  };

  if (success) {
    return (
      <div style={{ background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: 12, padding: "1.5rem", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(77,201,138,0.08)", border: "0.5px solid rgba(77,201,138,0.25)", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#4DC98A", marginBottom: 14 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4DC98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Your meeting request has been received. We will confirm your appointment shortly.
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              width: "100%", background: "transparent", border: "0.5px solid rgba(201,151,58,0.2)",
              color: "#9A9489", borderRadius: 10, padding: "12px", fontSize: 13, cursor: "pointer",
              fontFamily: "Inter, Arial, sans-serif",
            }}
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: 12, padding: "1.5rem", marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "#F0EDE6" }}>Request a meeting</div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#6B6762", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}
          >
            ×
          </button>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#6B6762", marginBottom: 20 }}>
        {landTitle}
      </div>

      {/* Full name */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Full name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ahmed Mohamed"
          style={inputStyle}
        />
      </div>

      {/* Phone */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Phone number</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+20 1XX XXX XXXX"
          style={inputStyle}
        />
      </div>

      {/* Date */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Preferred date</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => handleDateChange(e.target.value)}
          style={inputStyle}
        />
        {dateError && (
          <p style={{ fontSize: 11, color: "#E07070", marginTop: 6, marginBottom: 0 }}>
            {dateError}
          </p>
        )}
      </div>

      {/* Time */}
      {form.date && !dateError && (
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Preferred time</label>
          {timeSlots.length > 0 ? (
            <select
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Select a time...</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {formatSlotLabel(slot)}
                </option>
              ))}
            </select>
          ) : (
            <p style={{ fontSize: 12, color: "#6B6762", margin: 0 }}>
              No available time slots for this day.
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{ background: "rgba(200,60,60,0.1)", border: "0.5px solid rgba(200,60,60,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#E07070", marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!form.name || !form.phone || !isValidSelection || loading}
        style={{
          width: "100%",
          background: form.name && form.phone && isValidSelection ? "rgba(201,151,58,0.12)" : "rgba(201,151,58,0.04)",
          border: `0.5px solid ${form.name && form.phone && isValidSelection ? "#C9973A" : "rgba(201,151,58,0.15)"}`,
          color: form.name && form.phone && isValidSelection ? "#E8C97A" : "#6B6762",
          borderRadius: 10,
          padding: "12px",
          fontSize: 13,
          fontWeight: 500,
          cursor: form.name && form.phone && isValidSelection && !loading ? "pointer" : "not-allowed",
          fontFamily: "Inter, Arial, sans-serif",
          transition: "all 0.2s",
        }}
      >
        {loading ? "Submitting..." : "Request meeting"}
      </button>
    </div>
  );
}