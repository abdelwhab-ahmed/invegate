"use client";
import { useState } from "react";
import Image from "next/image";
import ReserveButton from "./ReserveButton";
import MeetingRequestForm from "./MeetingRequestForm";
import UnitPickerCard from "./UnitPickerCard";

const AREA_STATUS_STYLES = {
  available: { bg: "rgba(30,120,70,0.18)", border: "rgba(77,201,138,0.35)", text: "#4DC98A" },
  reserved:  { bg: "rgba(200,150,40,0.12)", border: "rgba(200,150,40,0.3)",  text: "#E8C97A" },
  sold:      { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.3)",   text: "#E07070" },
};

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: "1.5rem",
};
const modalCardStyle = {
  background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.3)",
  borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 380,
  maxHeight: "70vh", overflowY: "auto", boxSizing: "border-box",
};
const modalHeaderRow = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 };
const modalTitleStyle = { fontFamily: "Georgia, serif", fontSize: 16, color: "#F0EDE6" };
const closeBtnStyle = {
  background: "transparent", border: "none", color: "#6B6762",
  fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "4px 8px",
};
const emptyModalText = { fontSize: 13, color: "#6B6762", textAlign: "center", padding: "1rem 0" };

const cardStyle = {
  background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.12)",
  borderRadius: 10, padding: "12px 14px",
};
const cardLabelStyle = { fontSize: 9, color: "#6B6762", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.1em" };
const cardValueStyle = { fontSize: 14, fontWeight: 500, color: "#E8C97A" };

export default function ProjectDetails({
  land, developer, location, mapsUrl, whatsappUrl,
  landAreas, installmentPlans, priceRows, masterplanImages,
  customize_plan_whatsapp, developer_whatsapp, down_payment_amount,
  amman_whatsapp, developer_bank_account, office_schedule,
}) {
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [activeSpecKey, setActiveSpecKey] = useState(null); // drives the unit picker card

  const selectedArea = landAreas.find((a) => a.id === selectedAreaId) ?? null;
  const selectedPlan = installmentPlans.find((p) => p.id === selectedPlanId) ?? null;
  const bothSelected = Boolean(selectedArea && selectedPlan);

  const totalPrice = bothSelected
    ? priceRows.find(
        (r) => r.land_area_id === selectedAreaId && r.installment_plan_id === selectedPlanId
      )?.total_price ?? null
    : null;

  // Group land_areas rows by (area_sqm, bedrooms) — one entry per distinct spec,
  // each carrying all matching unit rows so we can count/filter by status.
  const specGroups = (() => {
    const map = new Map();
    landAreas.forEach((area) => {
      const key = `${area.area_sqm}__${area.bedrooms ?? "null"}`;
      if (!map.has(key)) {
        map.set(key, { key, area_sqm: area.area_sqm, bedrooms: area.bedrooms ?? null, units: [] });
      }
      map.get(key).units.push(area);
    });
    return Array.from(map.values());
  })();

  const activeGroup = specGroups.find((g) => g.key === activeSpecKey) ?? null;
  const activeGroupLabel = activeGroup
    ? `${Number(activeGroup.area_sqm).toLocaleString()} m²${activeGroup.bedrooms ? ` · ${activeGroup.bedrooms} bed` : ""}`
    : null;

  // "WhatsApp the Developer" — same pre-filled message, number swapped to developer_whatsapp.
  // Falls back to the original whatsappUrl (contact_whatsapp) if no developer number is set,
  // so the button never points at a broken link.
  const developerWhatsappUrl = developer_whatsapp
    ? `https://wa.me/${developer_whatsapp}?${whatsappUrl.split("?")[1] ?? ""}`
    : whatsappUrl;

  function openSpec(group) {
    const availableCount = group.units.filter((u) => u.status === "available").length;
    if (availableCount === 0) return;
    setActiveSpecKey(group.key);
    setShowAreaModal(false);
  }

  function closeUnitPicker() {
    setActiveSpecKey(null);
  }

  function selectUnit(area) {
    setSelectedAreaId(area.id);
    setActiveSpecKey(null);
  }

  function pickPlan(plan) {
    setSelectedPlanId(plan.id);
    setShowPlanModal(false);
  }

  function openCustomizePlan() {
    const msg = encodeURIComponent(
      `Hi, I'm interested in ${land.title} and would like to discuss a custom payment plan.`
    );
    const url = `https://wa.me/${customize_plan_whatsapp}?text=${msg}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* KEY INFO */}
      <div style={{ margin: "1rem 1.5rem 0", background: "#343437", borderRadius: 14, border: "0.5px solid rgba(201,151,58,0.18)", padding: "1.5rem" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: "#F0EDE6", lineHeight: 1.3, marginBottom: 16 }}>
          {land.title}
        </h1>

        {/* Row 1 — static */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 10 }}>
          <div style={cardStyle}>
            <div style={cardLabelStyle}>Price / m²</div>
            <div style={cardValueStyle}>
              {land.price_per_meter ? `EGP ${Number(land.price_per_meter).toLocaleString()}/m²` : "On request"}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={cardLabelStyle}>Project area</div>
            <div style={cardValueStyle}>
              {land.area_sqm ? `${Number(land.area_sqm).toLocaleString()} m²` : "TBC"}
            </div>
          </div>
        </div>

        {/* Row 2 — clickable */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: land.description ? 16 : 0 }}>
          <button
            onClick={() => setShowAreaModal(true)}
            style={{ ...cardStyle, textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }}
          >
            <div style={cardLabelStyle}>Available Area</div>
            <div style={{ ...cardValueStyle, color: selectedArea ? "#E8C97A" : "#9A9489" }}>
              {selectedArea ? `${Number(selectedArea.area_sqm).toLocaleString()} m²` : "Select size →"}
            </div>
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            style={{ ...cardStyle, textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }}
          >
            <div style={cardLabelStyle}>Installment Plan</div>
            <div style={{ ...cardValueStyle, color: selectedPlan ? "#E8C97A" : "#9A9489" }}>
              {selectedPlan ? `${selectedPlan.down_payment_percent}% / ${selectedPlan.years} yrs` : "Select plan →"}
            </div>
          </button>
        </div>

        {land.description && (
          <p style={{ fontSize: 14, color: "#9A9489", lineHeight: 1.7, borderTop: "0.5px solid rgba(201,151,58,0.12)", paddingTop: 16 }}>
            {land.description}
          </p>
        )}
      </div>

      {/* EXACT LOCATION — unchanged */}
      {mapsUrl && (
        <div style={{ margin: "1rem 1.5rem 0", background: "#343437", borderRadius: 14, border: "0.5px solid rgba(201,151,58,0.18)", padding: "1.5rem" }}>
          <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6762", marginBottom: 12 }}>Exact location</p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 12, background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.12)", borderRadius: 10, padding: "13px 16px", textDecoration: "none", color: "#F0EDE6", fontSize: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            View on Google Maps
            <span style={{ marginLeft: "auto", color: "#C9973A", fontSize: 12 }}>Open →</span>
          </a>
        </div>
      )}

      {/* INLINE NOTE — shown until both area and plan are selected */}
      {!bothSelected && (
        <div style={{ margin: "0.75rem 1.5rem 0", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6B6762" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6762" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Select an area and plan above to enable reservation
        </div>
      )}

      {/* DEVELOPER — unchanged */}
      {developer && (
        <div style={{ margin: "1rem 1.5rem 0", background: "#343437", borderRadius: 14, border: "0.5px solid rgba(201,151,58,0.18)", padding: "1.5rem" }}>
          <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6762", marginBottom: 14 }}>Developer</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: developer.bio ? 12 : 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(201,151,58,0.1)", border: "0.5px solid rgba(201,151,58,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 18, color: "#C9973A", flexShrink: 0, overflow: "hidden" }}>
              {developer.logo_url ? (
                <Image src={developer.logo_url} alt={developer.name} width={44} height={44} style={{ objectFit: "cover" }} />
              ) : (
                developer.name?.charAt(0)
              )}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: "#F0EDE6" }}>{developer.name}</div>
          </div>
          {developer.bio && (
            <p style={{ fontSize: 13, color: "#9A9489", lineHeight: 1.7 }}>{developer.bio}</p>
          )}
        </div>
      )}

      {/* CONTACT INVEGATE */}
      <div style={{ margin: "1rem 1.5rem 0", background: "#343437", borderRadius: 14, border: "0.5px solid rgba(201,151,58,0.18)", padding: "1.5rem" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6762", marginBottom: 10 }}>Contact Invegate</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.12)", borderRadius: 10, padding: "11px 14px", marginBottom: 14, fontSize: 12, color: "#6B6762" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          All inquiries go directly to Invegate — we handle everything for you
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href={developerWhatsappUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(30,120,70,0.18)", border: "0.5px solid rgba(77,201,138,0.35)", color: "#4DC98A", borderRadius: 12, padding: "14px", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4DC98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            WhatsApp the Developer
          </a>

          <ReserveButton
            landTitle={land.title}
            landId={land.id}
            selectedArea={selectedArea}
            selectedPlan={selectedPlan}
            totalPrice={totalPrice}
            downPaymentAmount={down_payment_amount}
            developer={developer}
            developerBankAccount={developer_bank_account}
            developerWhatsapp={developer_whatsapp}
            ammanWhatsapp={amman_whatsapp}
          />

          <button
            onClick={() => setShowMeetingForm(true)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "transparent",
              border: "0.5px solid rgba(201,151,58,0.18)",
              color: "#9A9489",
              borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 500, width: "100%",
              cursor: "pointer", fontFamily: "Inter, Arial, sans-serif",
            }}
          >
            Request a meeting
          </button>
        </div>
      </div>

      {/* REQUEST A MEETING — expanded panel below Contact Invegate */}
      {showMeetingForm && (
        <div style={{ margin: "1rem 1.5rem 0" }}>
          <MeetingRequestForm
            landId={land.id}
            landTitle={land.title}
            officeSchedule={office_schedule}
            onClose={() => setShowMeetingForm(false)}
          />
        </div>
      )}

      {/* AREA MODAL — grouped by spec (area_sqm, bedrooms); tapping an available
          spec opens the UnitPickerCard rather than selecting an area directly. */}
      {showAreaModal && (
        <div onClick={() => setShowAreaModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalCardStyle}>
            <div style={modalHeaderRow}>
              <span style={modalTitleStyle}>Select area</span>
              <button onClick={() => setShowAreaModal(false)} style={closeBtnStyle}>×</button>
            </div>
            {specGroups.length === 0 ? (
              <p style={emptyModalText}>No area options listed yet for this project.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {specGroups.map((group) => {
                  const availableCount = group.units.filter((u) => u.status === "available").length;
                  const disabled = availableCount === 0;
                  const isActiveSelection =
                    selectedArea &&
                    selectedArea.area_sqm === group.area_sqm &&
                    (selectedArea.bedrooms ?? null) === group.bedrooms;
                  return (
                    <button
                      key={group.key}
                      onClick={() => openSpec(group)}
                      disabled={disabled}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "#3A3A3D",
                        border: isActiveSelection ? "0.5px solid #C9973A" : "0.5px solid rgba(201,151,58,0.15)",
                        borderRadius: 10, padding: "12px 14px", textAlign: "left",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.5 : 1, fontFamily: "inherit", width: "100%",
                      }}
                    >
                      <span style={{ fontSize: 14, color: "#F0EDE6" }}>
                        {Number(group.area_sqm).toLocaleString()} m²{group.bedrooms ? ` · ${group.bedrooms} bed` : ""}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          background: disabled ? "rgba(200,60,60,0.12)" : "rgba(30,120,70,0.18)",
                          border: `0.5px solid ${disabled ? "rgba(200,60,60,0.3)" : "rgba(77,201,138,0.35)"}`,
                          color: disabled ? "#E07070" : "#4DC98A",
                          padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em",
                        }}
                      >
                        {disabled ? "Sold out" : `${availableCount} available`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UNIT PICKER CARD — masterplan gallery + slider of available units for the chosen spec */}
      {activeGroup && (
        <UnitPickerCard
          units={activeGroup.units.filter((u) => u.status === "available")}
          masterplanImages={masterplanImages}
          landTitle={land.title}
          specLabel={activeGroupLabel}
          onSelectUnit={selectUnit}
          onClose={closeUnitPicker}
        />
      )}

      {/* INSTALLMENT PLAN MODAL */}
      {showPlanModal && (
        <div onClick={() => setShowPlanModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalCardStyle}>
            <div style={modalHeaderRow}>
              <span style={modalTitleStyle}>Select installment plan</span>
              <button onClick={() => setShowPlanModal(false)} style={closeBtnStyle}>×</button>
            </div>
            {installmentPlans.length === 0 ? (
              <p style={emptyModalText}>No installment plans listed yet for this project.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {installmentPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => pickPlan(plan)}
                    style={{
                      display: "flex", flexDirection: "column", gap: 2,
                      background: "#3A3A3D",
                      border: plan.id === selectedPlanId ? "0.5px solid #C9973A" : "0.5px solid rgba(201,151,58,0.15)",
                      borderRadius: 10, padding: "12px 14px", textAlign: "left", cursor: "pointer",
                      fontFamily: "inherit", width: "100%",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#F0EDE6" }}>{plan.label}</span>
                    <span style={{ fontSize: 11, color: "#9A9489" }}>
                      {plan.down_payment_percent}% down payment · {plan.years} years
                    </span>
                  </button>
                ))}
              </div>
            )}

            {customize_plan_whatsapp && (
              <>
                <div style={{ height: 1, background: "rgba(201,151,58,0.15)", margin: "12px 0" }} />
                <button
                  onClick={openCustomizePlan}
                  style={{
                    display: "flex", flexDirection: "column", gap: 2,
                    background: "#3A3A3D",
                    border: "0.5px solid #C9973A",
                    borderRadius: 10, padding: "12px 14px", textAlign: "left", cursor: "pointer",
                    fontFamily: "inherit", width: "100%",
                  }}
                >
                  <span style={{ fontSize: 14, color: "#E8C97A" }}>Customize plan</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}