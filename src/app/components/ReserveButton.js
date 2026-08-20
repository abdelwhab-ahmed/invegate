"use client";
import { useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wfxrtbfyvyslglyhbwdq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmeHJ0YmZ5dnlzbGdseWhid2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTQ2MzAsImV4cCI6MjA5NzE5MDYzMH0.Ba7CyXV-cDaUNz0d8raJc-iNtECsPLTgnjoEm-D3juc"
);

export default function ReserveButton({
  landTitle,
  landId,
  selectedArea,
  selectedPlan,
  totalPrice,
  developer,
  downPaymentAmount,
  developerWhatsapp,
  ammanWhatsapp,
}) {
  const [step, setStep] = useState("idle");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const canReserve = Boolean(selectedArea && selectedPlan);

  async function handleSubmit() {
    if (!form.name || !form.phone || !selectedArea || !selectedPlan) return;
    setLoading(true);
    setError(null);

    try {
      let frontUrl = null;
      let backUrl = null;

      // Upload front ID photo
      if (idFront) {
        const frontPath = `${landId}/${Date.now()}_front_${idFront.name}`;
        const { error: frontError } = await supabase.storage
          .from("reservations")
          .upload(frontPath, idFront);
        if (frontError) throw new Error("Failed to upload front ID: " + frontError.message);
        frontUrl = frontPath;
      }

      // Upload back ID photo
      if (idBack) {
        const backPath = `${landId}/${Date.now()}_back_${idBack.name}`;
        const { error: backError } = await supabase.storage
          .from("reservations")
          .upload(backPath, idBack);
        if (backError) throw new Error("Failed to upload back ID: " + backError.message);
        backUrl = backPath;
      }

      // Save reservation to database
      const { error: insertError } = await supabase
        .from("reservations")
        .insert({
          land_id: landId,
          land_area_id: selectedArea.id,
          installment_plan_id: selectedPlan.id,
          full_name: form.name,
          phone: form.phone,
          national_id_front: frontUrl,
          national_id_back: backUrl,
          status: "pending",
        });

      if (insertError) throw new Error("Failed to save reservation: " + insertError.message);

      setStep("payment");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyBankAccount() {
    if (!developer?.bank_account) return;
    navigator.clipboard.writeText(developer.bank_account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => canReserve && setStep("form")}
        disabled={!canReserve}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: canReserve ? "rgba(201,151,58,0.08)" : "rgba(201,151,58,0.04)",
          border: `0.5px solid ${canReserve ? "rgba(201,151,58,0.35)" : "rgba(201,151,58,0.15)"}`,
          color: canReserve ? "#E8C97A" : "#6B6762",
          borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 500, width: "100%",
          cursor: canReserve ? "pointer" : "not-allowed", fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={canReserve ? "#E8C97A" : "#6B6762"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Buy your unit now
      </button>
    );
  }

  if (step === "form") {
    return (
      <div style={{ background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: 12, padding: "1.5rem", marginTop: 4 }}>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {["Info", "Down Payment"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "rgba(201,151,58,0.15)" : "transparent", border: `0.5px solid ${i === 0 ? "#C9973A" : "rgba(201,151,58,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: i === 0 ? "#C9973A" : "#6B6762" }}>{i + 1}</div>
              <span style={{ fontSize: 11, color: i === 0 ? "#C9973A" : "#6B6762" }}>{label}</span>
              {i === 0 && <div style={{ width: 30, height: 0.5, background: "rgba(201,151,58,0.2)" }} />}
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "#F0EDE6", marginBottom: 4 }}>Reserve your project</div>
        <div style={{ fontSize: 11, color: "#6B6762", marginBottom: 20 }}>
          {landTitle} · {selectedArea ? `${Number(selectedArea.area_sqm).toLocaleString()} m²` : ""} · {selectedPlan ? selectedPlan.label : ""}
        </div>

        {/* Full name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6762", marginBottom: 6 }}>Full name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ahmed Mohamed"
            style={{ width: "100%", background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: 8, padding: "11px 14px", fontSize: 13, color: "#F0EDE6", fontFamily: "Inter, Arial, sans-serif", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6762", marginBottom: 6 }}>Phone number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+20 1XX XXX XXXX"
            style={{ width: "100%", background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: 8, padding: "11px 14px", fontSize: 13, color: "#F0EDE6", fontFamily: "Inter, Arial, sans-serif", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* National ID front */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6762", marginBottom: 6 }}>National ID — front</label>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#2C2C2E", border: idFront ? "0.5px solid rgba(77,201,138,0.35)" : "0.5px dashed rgba(201,151,58,0.25)", borderRadius: 8, padding: "20px", cursor: "pointer", textAlign: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={idFront ? "#4DC98A" : "rgba(201,151,58,0.3)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <span style={{ fontSize: 12, color: idFront ? "#4DC98A" : "#6B6762" }}>{idFront ? idFront.name : "Tap to upload front"}</span>
            <span style={{ fontSize: 10, color: "#6B6762", opacity: 0.6 }}>JPG or PNG · max 5MB</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setIdFront(e.target.files[0])} />
          </label>
        </div>

        {/* National ID back */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6762", marginBottom: 6 }}>National ID — back</label>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#2C2C2E", border: idBack ? "0.5px solid rgba(77,201,138,0.35)" : "0.5px dashed rgba(201,151,58,0.25)", borderRadius: 8, padding: "20px", cursor: "pointer", textAlign: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={idBack ? "#4DC98A" : "rgba(201,151,58,0.3)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <span style={{ fontSize: 12, color: idBack ? "#4DC98A" : "#6B6762" }}>{idBack ? idBack.name : "Tap to upload back"}</span>
            <span style={{ fontSize: 10, color: "#6B6762", opacity: 0.6 }}>JPG or PNG · max 5MB</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setIdBack(e.target.files[0])} />
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ background: "rgba(200,60,60,0.1)", border: "0.5px solid rgba(200,60,60,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#E07070", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setStep("idle")} style={{ flex: 1, background: "transparent", border: "0.5px solid rgba(201,151,58,0.2)", color: "#6B6762", borderRadius: 10, padding: "12px", fontSize: 13, cursor: "pointer", fontFamily: "Inter, Arial, sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.phone || loading}
            style={{ flex: 2, background: form.name && form.phone ? "rgba(201,151,58,0.12)" : "rgba(201,151,58,0.04)", border: `0.5px solid ${form.name && form.phone ? "#C9973A" : "rgba(201,151,58,0.15)"}`, color: form.name && form.phone ? "#E8C97A" : "#6B6762", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 500, cursor: form.name && form.phone && !loading ? "pointer" : "not-allowed", fontFamily: "Inter, Arial, sans-serif", transition: "all 0.2s" }}
          >
            {loading ? "Saving..." : "Confirm & proceed to payment →"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "payment") {
    const waConfirmMessage = encodeURIComponent(
      `Hi, I've completed the down payment for ${landTitle}. Here is my confirmation.`
    );
    const waConfirmUrl = `https://wa.me/${developerWhatsapp ?? ""}?text=${waConfirmMessage}`;

    const ammanMessage = encodeURIComponent(
      `Hi, I'd like to request the Amman service for my reservation of ${landTitle}.`
    );
    const ammanUrl = `https://wa.me/${ammanWhatsapp ?? ""}?text=${ammanMessage}`;

    const depositLabel = downPaymentAmount
      ? `EGP ${Number(downPaymentAmount).toLocaleString()}`
      : null;

    const hasAmman = Boolean(ammanWhatsapp);

    return (
      <div style={{ background: "#3A3A3D", border: "0.5px solid rgba(91,155,213,0.3)", borderRadius: 12, padding: "1.5rem", marginTop: 4 }}>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {["Info", "Down Payment"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 1 ? "rgba(91,155,213,0.15)" : "rgba(77,201,138,0.15)", border: `0.5px solid ${i === 1 ? "#5B9BD5" : "#4DC98A"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: i === 1 ? "#5B9BD5" : "#4DC98A" }}>{i === 0 ? "✓" : "2"}</div>
              <span style={{ fontSize: 11, color: i === 1 ? "#5B9BD5" : "#4DC98A" }}>{label}</span>
              {i === 0 && <div style={{ width: 30, height: 0.5, background: "rgba(91,155,213,0.3)" }} />}
            </div>
          ))}
        </div>

        {/* Success note */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(77,201,138,0.08)", border: "0.5px solid rgba(77,201,138,0.25)", borderRadius: 10, padding: "11px 14px", marginBottom: 14, fontSize: 12, color: "#4DC98A" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4DC98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Your details have been saved — complete payment to confirm
        </div>

        {/* Deposit amount */}
        <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.15)", borderRadius: 10, padding: "16px", textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6762", marginBottom: 8 }}>Down Payment</div>
          {depositLabel ? (
            <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: "#C9973A" }}>{depositLabel}</div>
          ) : (
            <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: "#6B6762" }}>To be confirmed</div>
          )}
        </div>

        {/* Developer identity block */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.18)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(201,151,58,0.1)", border: "0.5px solid rgba(201,151,58,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontSize: 18, color: "#C9973A", flexShrink: 0, overflow: "hidden" }}>
            {developer?.logo_url ? (
              <Image src={developer.logo_url} alt={developer.name ?? ""} width={44} height={44} style={{ objectFit: "cover" }} />
            ) : (
              developer?.name?.charAt(0) ?? "—"
            )}
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#F0EDE6" }}>{developer?.name ?? "—"}</div>
        </div>

        {/* Payment options: Bank Account + Amman */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {/* Bank Account */}
          <div style={{ flex: 1, background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.15)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6762", marginBottom: 8 }}>Bank Account</div>
            {developer?.bank_account ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#F0EDE6", letterSpacing: "0.02em", marginBottom: 8, wordBreak: "break-all" }}>
                  {developer.bank_account}
                </div>
                <button
                  onClick={handleCopyBankAccount}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: copied ? "rgba(77,201,138,0.12)" : "rgba(201,151,58,0.1)",
                    border: `0.5px solid ${copied ? "rgba(77,201,138,0.4)" : "rgba(201,151,58,0.3)"}`,
                    color: copied ? "#4DC98A" : "#C9973A",
                    borderRadius: 7, padding: "6px 10px", fontSize: 11, cursor: "pointer",
                    fontFamily: "Inter, Arial, sans-serif",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  {copied ? "Copied" : "Copy"}
                </button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#6B6762" }}>Contact developer</div>
            )}
          </div>

          {/* Amman */}
          {hasAmman && (
            <div style={{ flex: 1, background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.15)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6762", marginBottom: 8 }}>Amman</div>
              <p style={{ fontSize: 11, color: "#9A9489", lineHeight: 1.5, marginBottom: 10 }}>
                A trusted courier collects your payment, issues an insurance note, and returns your signed contract within 10 days.
              </p>
              <a
                href={ammanUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(201,151,58,0.1)", border: "0.5px solid rgba(201,151,58,0.3)",
                  color: "#C9973A", borderRadius: 7, padding: "6px 10px", fontSize: 11,
                  textDecoration: "none", fontFamily: "Inter, Arial, sans-serif",
                }}
              >
                Request Amman
              </a>
            </div>
          )}
        </div>

        {/* Steps */}
        <div style={{ background: "#2C2C2E", border: "0.5px solid rgba(201,151,58,0.12)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6762", marginBottom: 12 }}>How to pay</div>
          {[
            "Open your banking app and go to InstaPay",
            "Transfer the down payment to the bank account above or use the Amman service",
            "Take a screenshot of the confirmation",
            "Send the screenshot to Invegate on WhatsApp below",
          ].map((text, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 3 ? 10 : 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(201,151,58,0.1)", border: "0.5px solid rgba(201,151,58,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#C9973A", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: "#9A9489", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Shield note */}
        <div style={{ display: "flex", gap: 10, background: "rgba(201,151,58,0.04)", border: "0.5px solid rgba(201,151,58,0.12)", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 11, color: "#6B6762", lineHeight: 1.6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9973A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Your reservation is confirmed once Invegate verifies the payment. You will receive a confirmation within 24 hours.
        </div>

        <a href={waConfirmUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(91,155,213,0.12)", border: "0.5px solid rgba(91,155,213,0.35)", color: "#5B9BD5", borderRadius: 10, padding: "13px", textDecoration: "none", fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5B9BD5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Send confirmation screenshot on WhatsApp
        </a>

        <button onClick={() => setStep("idle")} style={{ width: "100%", background: "transparent", border: "none", color: "#6B6762", fontSize: 12, cursor: "pointer", padding: "8px", fontFamily: "Inter, Arial, sans-serif" }}>
          ← Back to project
        </button>
      </div>
    );
  }
}