"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function OfficeHoursPage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedFlash, setSavedFlash] = useState({});

  async function fetchSchedule() {
    const { data } = await supabase.from("office_schedule").select("*").order("day_of_week");
    setSchedule(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchSchedule(); }, []);

  function flashSaved(id) {
    setSavedFlash(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setSavedFlash(prev => ({ ...prev, [id]: false }));
    }, 1500);
  }

  async function updateRow(row, updates) {
    const nextRow = { ...row, ...updates };
    setSchedule(prev => prev.map(r => (r.id === row.id ? nextRow : r)));
    const { error } = await supabase
      .from("office_schedule")
      .update({
        is_open: nextRow.is_open,
        open_time: nextRow.open_time,
        close_time: nextRow.close_time,
      })
      .eq("id", row.id);
    if (!error) flashSaved(row.id);
  }

  const labelStyle = {
    fontSize: "9px", color: "#6B6762", letterSpacing: "0.12em",
    textTransform: "uppercase", marginBottom: "6px", display: "block",
  };
  const timeInputStyle = {
    background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.25)",
    borderRadius: "8px", padding: "8px 10px", color: "#F0EDE6",
    fontSize: "13px", outline: "none", fontFamily: "Inter, Arial, sans-serif",
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#F0EDE6", margin: 0, marginBottom: "5px" }}>
          Office Working Hours
        </h1>
        <p style={{ color: "#9A9489", fontSize: "13px", margin: 0 }}>
          Sets the days and times buyers can request an office meeting
        </p>
      </div>

      <div style={{
        background: "#343437",
        border: "0.5px solid rgba(201,151,58,0.18)",
        borderRadius: "12px",
        padding: "24px",
      }}>
        {loading ? (
          <p style={{ color: "#9A9489", fontSize: "13px" }}>Loading...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {schedule.map(row => (
              <div key={row.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "10px 0",
                borderBottom: "0.5px solid rgba(201,151,58,0.08)",
              }}>
                {/* Toggle + day name */}
                <label style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  width: "130px", flexShrink: 0, cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={row.is_open}
                    onChange={e => updateRow(row, { is_open: e.target.checked })}
                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#C9973A" }}
                  />
                  <span style={{ fontSize: "13px", color: "#F0EDE6" }}>{row.day_name}</span>
                </label>

                {/* Times */}
                {row.is_open ? (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
                    <div>
                      <span style={labelStyle}>From</span>
                      <input
                        type="time"
                        value={row.open_time ? row.open_time.slice(0, 5) : ""}
                        onChange={e => updateRow(row, { open_time: e.target.value })}
                        style={timeInputStyle}
                      />
                    </div>
                    <div>
                      <span style={labelStyle}>To</span>
                      <input
                        type="time"
                        value={row.close_time ? row.close_time.slice(0, 5) : ""}
                        onChange={e => updateRow(row, { close_time: e.target.value })}
                        style={timeInputStyle}
                      />
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: "12px", color: "#6B6762", fontStyle: "italic" }}>Closed</span>
                )}

                {/* Saved flash */}
                <span style={{
                  fontSize: "11px", color: "#4DC98A",
                  opacity: savedFlash[row.id] ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  marginLeft: "auto",
                  display: "flex", alignItems: "center", gap: "4px",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4DC98A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}