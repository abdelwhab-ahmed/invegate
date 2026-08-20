"use client";
import PhotoGallery from "./PhotoGallery";

const AREA_STATUS_STYLES = {
  available: { bg: "rgba(30,120,70,0.18)", border: "rgba(77,201,138,0.35)", text: "#4DC98A" },
  reserved:  { bg: "rgba(200,150,40,0.12)", border: "rgba(200,150,40,0.3)",  text: "#E8C97A" },
  sold:      { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.3)",   text: "#E07070" },
};

const overlayStyle = {
  position: "fixed", inset: 0, background: "#2C2C2E",
  zIndex: 1000, overflowY: "auto", WebkitOverflowScrolling: "touch",
};
const modalHeaderRow = {
  position: "sticky", top: 0, zIndex: 2,
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "1.1rem 1.5rem", background: "#2C2C2E",
  borderBottom: "0.5px solid rgba(201,151,58,0.15)",
};
const modalTitleStyle = { fontFamily: "Georgia, serif", fontSize: 18, color: "#F0EDE6" };
const closeBtnStyle = {
  background: "rgba(255,255,255,0.06)", border: "none", color: "#F0EDE6",
  fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "6px 12px",
  borderRadius: 8,
};
const sectionLabelStyle = {
  fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6762",
  margin: "0 1.5rem 12px",
};
const emptyModalText = { fontSize: 13, color: "#6B6762", textAlign: "center", padding: "1rem 1.5rem 2rem" };

// Props:
// - units: land_areas rows for the chosen (area_sqm, bedrooms) spec, already
//   filtered to status === "available" by the caller (ProjectDetails).
// - masterplanImages: land_images rows where is_masterplan = true for this project.
//   Section is omitted entirely if this array is empty — no placeholder.
// - landTitle: used for the masterplan gallery alt text.
// - specLabel: header text, e.g. "120 m² · 2 bed".
// - onSelectUnit(area): called with the chosen land_areas row.
// - onClose(): closes the card without selecting.
export default function UnitPickerCard({
  units, masterplanImages, landTitle, specLabel, onSelectUnit, onClose,
}) {
  function unitLabel(unit) {
    return unit.unit_label && unit.unit_label.trim()
      ? unit.unit_label
      : `${Number(unit.area_sqm).toLocaleString()} m²${unit.bedrooms ? ` · ${unit.bedrooms} bed` : ""}`;
  }

  return (
    <div style={overlayStyle}>
      <div style={modalHeaderRow}>
        <span style={modalTitleStyle}>{specLabel ?? "Select unit"}</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>

      {masterplanImages && masterplanImages.length > 0 && (
        <div style={{ marginTop: 20, marginBottom: 28 }}>
          <p style={sectionLabelStyle}>Masterplan</p>
          <PhotoGallery
            images={masterplanImages}
            alt={`${landTitle} masterplan`}
            hideStatusBadge
          />
        </div>
      )}

      <p style={sectionLabelStyle}>Available units</p>

      {units.length === 0 ? (
        <p style={emptyModalText}>No units currently available for this size.</p>
      ) : (
        <div
          style={{
            display: "flex", gap: 10, overflowX: "auto",
            scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
            padding: "0 1.5rem 2rem",
          }}
        >
          {units.map((unit) => {
            const st = AREA_STATUS_STYLES[unit.status] ?? AREA_STATUS_STYLES.available;
            return (
              <button
                key={unit.id}
                onClick={() => onSelectUnit(unit)}
                style={{
                  flex: "0 0 220px", scrollSnapAlign: "start",
                  display: "flex", flexDirection: "column", gap: 10,
                  background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.15)",
                  borderRadius: 10, padding: "18px 16px", textAlign: "left",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: 15, color: "#F0EDE6", fontWeight: 500 }}>
                  {unitLabel(unit)}
                </span>
                <span
                  style={{
                    fontSize: 10, background: st.bg, border: `0.5px solid ${st.border}`, color: st.text,
                    padding: "3px 10px", borderRadius: 20, textTransform: "capitalize",
                    letterSpacing: "0.06em", alignSelf: "flex-start",
                  }}
                >
                  {unit.status}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}