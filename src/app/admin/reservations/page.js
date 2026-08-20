"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_TABS = ["all", "pending", "confirmed", "rejected"];

const STATUS_STYLES = {
  pending:   { color: "#E8C97A", bg: "rgba(200,150,40,0.12)",  border: "rgba(200,150,40,0.3)"  },
  confirmed: { color: "#4DC98A", bg: "rgba(30,120,70,0.18)",   border: "rgba(77,201,138,0.35)" },
  rejected:  { color: "#E07070", bg: "rgba(200,60,60,0.12)",   border: "rgba(200,60,60,0.3)"   },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
      textTransform: "capitalize", letterSpacing: "0.08em",
      color: s.color, background: s.bg, border: `0.5px solid ${s.border}`,
      display: "inline-block",
    }}>
      {status}
    </span>
  );
}

function InfoRow({ label, value, gold }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, color: "#6B6762", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: gold ? "#E8C97A" : "#F0EDE6", fontWeight: gold ? 500 : 400 }}>
        {value || "—"}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
      color: "#6B6762", marginBottom: 12, marginTop: 0,
    }}>
      {children}
    </p>
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState("all");
  const [selected, setSelected]           = useState(null);
  const [idFrontUrl, setIdFrontUrl]       = useState(null);
  const [idBackUrl, setIdBackUrl]         = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => { fetchReservations(); }, []);

  async function fetchReservations() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        lands (
          id, title, area_sqm, price_per_meter,
          locations ( name )
        ),
        land_areas ( area_sqm, status ),
        land_installment_plans ( label, down_payment_percent, years )
      `)
      .order("created_at", { ascending: false });

    if (!error) setReservations(data ?? []);
    setLoading(false);
  }

  async function selectReservation(r) {
    setSelected(r);
    setIdFrontUrl(null);
    setIdBackUrl(null);
    setConfirmDelete(false);

    if (r.national_id_front) {
      const { data } = await supabase.storage.from("reservations").createSignedUrl(r.national_id_front, 3600);
      if (data?.signedUrl) setIdFrontUrl(data.signedUrl);
    }
    if (r.national_id_back) {
      const { data } = await supabase.storage.from("reservations").createSignedUrl(r.national_id_back, 3600);
      if (data?.signedUrl) setIdBackUrl(data.signedUrl);
    }
  }

  async function updateStatus(newStatus) {
    if (!selected) return;
    setUpdatingStatus(true);
    const { error } = await supabase.from("reservations").update({ status: newStatus }).eq("id", selected.id);
    if (!error) {
      const updated = { ...selected, status: newStatus };
      setSelected(updated);
      setReservations(prev => prev.map(r => r.id === selected.id ? { ...r, status: newStatus } : r));
    }
    setUpdatingStatus(false);
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);

    // Delete storage files if they exist
    const filesToDelete = [];
    if (selected.national_id_front) filesToDelete.push(selected.national_id_front);
    if (selected.national_id_back)  filesToDelete.push(selected.national_id_back);
    if (filesToDelete.length > 0) {
      await supabase.storage.from("reservations").remove(filesToDelete);
    }

    // Delete the reservation row
    const { error } = await supabase.from("reservations").delete().eq("id", selected.id);
    if (!error) {
      setReservations(prev => prev.filter(r => r.id !== selected.id));
      setSelected(null);
      setConfirmDelete(false);
    }
    setDeleting(false);
  }

  const filtered = activeTab === "all"
    ? reservations
    : reservations.filter(r => r.status === activeTab);

  function formatDate(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
  }

  function getProjectName(r)   { return r.lands?.title ?? "—"; }
  function getLocationName(r)  { return r.lands?.locations?.name ?? "—"; }
  function getReservedArea(r) {
    if (r.land_areas?.area_sqm)  return `${Number(r.land_areas.area_sqm).toLocaleString()} m²`;
    if (r.lands?.area_sqm)       return `${Number(r.lands.area_sqm).toLocaleString()} m² (project total)`;
    return "—";
  }
  function getPlanLabel(r) {
    const plan = r.land_installment_plans;
    if (!plan) return "—";
    return plan.label || `${plan.down_payment_percent}% down — ${plan.years} yrs`;
  }
  function getPlanDetails(r) {
    const plan = r.land_installment_plans;
    if (!plan) return null;
    const parts = [];
    if (plan.down_payment_percent != null) parts.push(`${plan.down_payment_percent}% down payment`);
    if (plan.years != null) parts.push(`${plan.years} year${plan.years !== 1 ? "s" : ""}`);
    return parts.join(" · ") || null;
  }
  function getPricePerMeter(r) {
    const ppm = r.lands?.price_per_meter;
    if (!ppm) return "—";
    return `EGP ${Number(ppm).toLocaleString()} / m²`;
  }

  return (
    <div style={{ padding: "32px 28px", minHeight: "100vh", color: "#F0EDE6" }}>
      <h1 style={{
        fontFamily: "var(--font-heading, 'Cormorant Garamond', Georgia, serif)",
        fontSize: 28, fontWeight: 400, color: "#F0EDE6", marginBottom: 6,
      }}>
        Reservations
      </h1>
      <p style={{ fontSize: 13, color: "#6B6762", marginBottom: 28 }}>
        {reservations.length} total reservation{reservations.length !== 1 ? "s" : ""}
      </p>

      {/* Tab filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {STATUS_TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 16px", borderRadius: 20, fontSize: 12,
                fontWeight: isActive ? 500 : 400, letterSpacing: "0.04em",
                textTransform: "capitalize", cursor: "pointer",
                border: isActive ? "0.5px solid rgba(201,151,58,0.55)" : "0.5px solid rgba(201,151,58,0.18)",
                background: isActive ? "rgba(201,151,58,0.1)" : "transparent",
                color: isActive ? "#C9973A" : "#9A9489",
                transition: "all 0.2s ease",
              }}
            >
              {tab}
              {tab !== "all" && (
                <span style={{ marginLeft: 6, color: isActive ? "#C9973A" : "#6B6762" }}>
                  ({reservations.filter(r => r.status === tab).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ color: "#6B6762", fontSize: 14, padding: "40px 0", textAlign: "center" }}>
          Loading reservations…
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>

          {/* ── LEFT: list ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "3rem", color: "#6B6762",
                background: "#343437", borderRadius: 12, border: "0.5px solid rgba(201,151,58,0.18)", fontSize: 14,
              }}>
                No {activeTab === "all" ? "" : activeTab} reservations yet
              </div>
            ) : (
              filtered.map(r => {
                const isSelected = selected?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => selectReservation(r)}
                    style={{
                      padding: "14px 16px",
                      background: isSelected ? "rgba(201,151,58,0.07)" : "#343437",
                      border: isSelected ? "0.5px solid rgba(201,151,58,0.45)" : "0.5px solid rgba(201,151,58,0.18)",
                      borderRadius: 12, cursor: "pointer", transition: "all 0.2s ease",
                      display: "flex", alignItems: "flex-start", gap: 14,
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "rgba(201,151,58,0.35)";
                        e.currentTarget.style.background = "rgba(201,151,58,0.04)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "rgba(201,151,58,0.18)";
                        e.currentTarget.style.background = "#343437";
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "rgba(201,151,58,0.1)", border: "0.5px solid rgba(201,151,58,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-heading, Georgia, serif)",
                      fontSize: 16, color: "#C9973A", flexShrink: 0,
                    }}>
                      {r.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#F0EDE6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.full_name}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div style={{ fontSize: 12, color: "#C9973A", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {getProjectName(r)}
                        {getLocationName(r) !== "—" && <span style={{ color: "#6B6762" }}> · {getLocationName(r)}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B6762", flexWrap: "wrap" }}>
                        {r.land_areas && <span>{getReservedArea(r)}</span>}
                        {r.land_installment_plans && <span>{getPlanLabel(r)}</span>}
                        <span style={{ marginLeft: "auto" }}>{formatDate(r.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── RIGHT: detail panel ── */}
          {selected && (
            <div style={{
              background: "#343437",
              border: "0.5px solid rgba(201,151,58,0.22)",
              borderRadius: 14,
              padding: "20px",
              position: "sticky",
              top: 20,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{
                    fontFamily: "var(--font-heading, Georgia, serif)",
                    fontSize: 20, fontWeight: 400, color: "#F0EDE6", marginBottom: 4,
                  }}>
                    {selected.full_name}
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <button
                  onClick={() => { setSelected(null); setConfirmDelete(false); }}
                  style={{
                    background: "none", border: "none", color: "#6B6762",
                    cursor: "pointer", fontSize: 18, padding: "2px 6px",
                    lineHeight: 1, borderRadius: 6, transition: "color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#F0EDE6"}
                  onMouseLeave={e => e.currentTarget.style.color = "#6B6762"}
                  title="Close"
                >
                  ×
                </button>
              </div>

              {/* Section 1: Project */}
              <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.14)", borderRadius: 10, padding: "14px 14px 6px", marginBottom: 14 }}>
                <SectionLabel>Project</SectionLabel>
                <InfoRow label="Project name" value={getProjectName(selected)} gold />
                <InfoRow label="Location"     value={getLocationName(selected)} />
                <InfoRow label="Price / m²"   value={getPricePerMeter(selected)} gold />
              </div>

              {/* Section 2: Reservation details */}
              <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.14)", borderRadius: 10, padding: "14px 14px 6px", marginBottom: 14 }}>
                <SectionLabel>Reservation Details</SectionLabel>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#6B6762", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>Reserved Area</div>
                  {selected.land_areas ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, color: "#E8C97A", fontWeight: 500 }}>{getReservedArea(selected)}</span>
                      <StatusBadge status={selected.land_areas.status} />
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: "#6B6762", fontStyle: "italic" }}>No area selected (legacy reservation)</span>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#6B6762", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>Payment Plan</div>
                  {selected.land_installment_plans ? (
                    <div>
                      <div style={{ fontSize: 14, color: "#E8C97A", fontWeight: 500, marginBottom: 2 }}>{getPlanLabel(selected)}</div>
                      {getPlanDetails(selected) && <div style={{ fontSize: 11, color: "#9A9489" }}>{getPlanDetails(selected)}</div>}
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: "#6B6762", fontStyle: "italic" }}>No plan selected (legacy reservation)</span>
                  )}
                </div>
              </div>

              {/* Section 3: Buyer */}
              <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.14)", borderRadius: 10, padding: "14px 14px 6px", marginBottom: 14 }}>
                <SectionLabel>Buyer</SectionLabel>
                <InfoRow label="Full name" value={selected.full_name} />
                <InfoRow label="Phone"     value={selected.phone} />
                <InfoRow label="Submitted" value={formatDate(selected.created_at)} />
              </div>

              {/* Section 4: National ID photos */}
              <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.14)", borderRadius: 10, padding: "14px", marginBottom: 14 }}>
                <SectionLabel>National ID</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Front", url: idFrontUrl, path: selected.national_id_front },
                    { label: "Back",  url: idBackUrl,  path: selected.national_id_back  },
                  ].map(({ label, url, path }) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, color: "#6B6762", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
                      {path ? (
                        url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                            <img src={url} alt={`National ID ${label}`} style={{
                              width: "100%", aspectRatio: "4/3", objectFit: "cover",
                              borderRadius: 8, border: "0.5px solid rgba(201,151,58,0.22)", display: "block",
                            }} />
                          </a>
                        ) : (
                          <div style={{
                            width: "100%", aspectRatio: "4/3", borderRadius: 8,
                            background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.14)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, color: "#6B6762",
                          }}>Loading…</div>
                        )
                      ) : (
                        <div style={{
                          width: "100%", aspectRatio: "4/3", borderRadius: 8,
                          background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, color: "#6B6762",
                        }}>Not uploaded</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Status controls */}
              <div style={{ marginBottom: 14 }}>
                <SectionLabel>Update Status</SectionLabel>
                <div style={{ display: "flex", gap: 8 }}>
                  {["pending", "confirmed", "rejected"].map(s => {
                    const st = STATUS_STYLES[s];
                    const isActive = selected.status === s;
                    return (
                      <button
                        key={s}
                        disabled={updatingStatus || isActive}
                        onClick={() => updateStatus(s)}
                        style={{
                          flex: 1, padding: "9px 6px", borderRadius: 9, fontSize: 11,
                          fontWeight: isActive ? 500 : 400, letterSpacing: "0.06em",
                          textTransform: "capitalize", cursor: isActive ? "default" : "pointer",
                          border: `0.5px solid ${isActive ? st.border : "rgba(201,151,58,0.18)"}`,
                          background: isActive ? st.bg : "transparent",
                          color: isActive ? st.color : "#6B6762",
                          opacity: updatingStatus && !isActive ? 0.5 : 1,
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={e => {
                          if (!isActive && !updatingStatus) {
                            e.currentTarget.style.color = st.color;
                            e.currentTarget.style.borderColor = st.border;
                            e.currentTarget.style.background = st.bg;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.color = "#6B6762";
                            e.currentTarget.style.borderColor = "rgba(201,151,58,0.18)";
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 6: Delete */}
              <div style={{ borderTop: "0.5px solid rgba(201,151,58,0.12)", paddingTop: 14 }}>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      width: "100%", padding: "9px", borderRadius: 9, fontSize: 12,
                      cursor: "pointer", letterSpacing: "0.04em",
                      border: "0.5px solid rgba(200,60,60,0.25)",
                      background: "transparent", color: "#6B6762",
                      transition: "all 0.2s ease",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = "#E07070";
                      e.currentTarget.style.borderColor = "rgba(200,60,60,0.5)";
                      e.currentTarget.style.background = "rgba(200,60,60,0.08)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = "#6B6762";
                      e.currentTarget.style.borderColor = "rgba(200,60,60,0.25)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Delete reservation
                  </button>
                ) : (
                  <div style={{
                    background: "rgba(200,60,60,0.08)", border: "0.5px solid rgba(200,60,60,0.3)",
                    borderRadius: 9, padding: "12px 14px",
                  }}>
                    <p style={{ fontSize: 12, color: "#E07070", marginBottom: 10, lineHeight: 1.5 }}>
                      This will permanently delete this reservation and its ID photos. This cannot be undone.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        style={{
                          flex: 1, padding: "8px", borderRadius: 8, fontSize: 12,
                          cursor: "pointer", border: "0.5px solid rgba(201,151,58,0.18)",
                          background: "transparent", color: "#9A9489", transition: "all 0.2s ease",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                          flex: 1, padding: "8px", borderRadius: 8, fontSize: 12,
                          cursor: deleting ? "default" : "pointer",
                          border: "0.5px solid rgba(200,60,60,0.5)",
                          background: "rgba(200,60,60,0.15)", color: "#E07070",
                          fontWeight: 500, transition: "all 0.2s ease",
                          opacity: deleting ? 0.6 : 1,
                        }}
                      >
                        {deleting ? "Deleting…" : "Yes, delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}