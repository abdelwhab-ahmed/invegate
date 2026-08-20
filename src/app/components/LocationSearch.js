"use client";
import { useState } from "react";
import LocationCard from "./LocationCard";

export default function LocationSearch({ locations, countByLocation }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const filtered = locations?.filter((loc) =>
    loc.name.toLowerCase().includes(query.toLowerCase())
  ) ?? [];

  return (
    <>
      {/* Search bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: focused ? "2px solid #C9973A" : "2px solid rgba(201,151,58,0.25)",
        padding: "12px 4px",
        marginBottom: "2.5rem",
        transition: "border-color 0.2s ease",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={focused ? "#C9973A" : "#6B6762"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: "stroke 0.2s" }}>
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search locations..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 16,
            color: "#F0EDE6",
            fontFamily: "Inter, Arial, sans-serif",
          }}
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              background: "none",
              border: "none",
              color: "#6B6762",
              cursor: "pointer",
              fontSize: 20,
              padding: "0 4px",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Results label */}
      {query && (
        <p style={{
          fontSize: 11,
          color: "#6B6762",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <p style={{ color: "#6B6762", fontSize: 14 }}>
          No locations match &quot;{query}&quot;
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 320px))",
          gap: 14,
        }}>
          {filtered.map((loc) => (
            <LocationCard
              key={loc.id}
              loc={loc}
              count={countByLocation[loc.id] ?? 0}
            />
          ))}
        </div>
      )}
    </>
  );
}