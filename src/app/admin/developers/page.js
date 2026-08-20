"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const emptyForm = { name: "", bio: "", logo_url: "", bank_account: "" };

export default function AdminDevelopers() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function fetchDevelopers() {
    const { data } = await supabase.from("developers").select("*").order("name");
    setDevelopers(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchDevelopers(); }, []);

  function openAdd() { setForm(emptyForm); setEditId(null); setError(""); setLogoFile(null); setShowForm(true); }
  function openEdit(dev) {
    setForm({ name: dev.name || "", bio: dev.bio || "", logo_url: dev.logo_url || "", bank_account: dev.bank_account || "" });
    setEditId(dev.id); setError(""); setLogoFile(null); setShowForm(true);
  }
  function cancelForm() { setShowForm(false); setForm(emptyForm); setEditId(null); setError(""); setLogoFile(null); }

  async function uploadLogo(file) {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("developer-logos").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("developer-logos").getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");

    let finalLogoUrl = form.logo_url.trim() || null;

    if (logoFile) {
      setUploading(true);
      try {
        finalLogoUrl = await uploadLogo(logoFile);
      } catch (err) {
        setError("Logo upload failed: " + err.message);
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (editId) {
      const { error } = await supabase.from("developers").update({
        name: form.name.trim(), bio: form.bio.trim(), logo_url: finalLogoUrl,
        bank_account: form.bank_account.trim() || null,
      }).eq("id", editId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("developers").insert({
        name: form.name.trim(), bio: form.bio.trim(), logo_url: finalLogoUrl,
        bank_account: form.bank_account.trim() || null,
      });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false); cancelForm(); fetchDevelopers();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this developer?")) return;
    setDeletingId(id);
    await supabase.from("developers").delete().eq("id", id);
    setDeletingId(null); fetchDevelopers();
  }

  const inputStyle = {
    width: "100%", background: "#3A3A3D",
    border: "0.5px solid rgba(201,151,58,0.25)", borderRadius: "10px",
    padding: "11px 14px", color: "#F0EDE6", fontSize: "14px",
    outline: "none", boxSizing: "border-box", fontFamily: "Inter, Arial, sans-serif",
  };
  const labelStyle = {
    display: "block", fontSize: "11px", color: "#9A9489",
    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px",
  };

  const previewUrl = logoFile ? URL.createObjectURL(logoFile) : form.logo_url;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#F0EDE6", margin: 0, marginBottom: "5px" }}>Developers</h1>
          <p style={{ color: "#9A9489", fontSize: "13px", margin: 0 }}>{developers.length} developer{developers.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} style={{
          background: "#C9973A", color: "#2C2C2E", border: "none", borderRadius: "10px",
          padding: "11px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
        }}>
          + Add developer
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.3)", borderRadius: "14px", padding: "28px", marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", color: "#F0EDE6", margin: "0 0 22px", fontWeight: "500" }}>
            {editId ? "Edit developer" : "New developer"}
          </h2>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Developer company name" />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Bio</label>
            <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Short paragraph shown on project pages..." />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Bank Account Number</label>
            <input style={inputStyle} value={form.bank_account}
              onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))}
              placeholder="Account number shown to buyers on the payment screen" />
          </div>

          {/* Logo upload */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Logo</label>

            {previewUrl && (
              <div style={{ marginBottom: "12px" }}>
                <img src={previewUrl} alt="" style={{
                  width: "72px", height: "72px", objectFit: "cover",
                  borderRadius: "999px", border: "0.5px solid rgba(201,151,58,0.25)",
                }} />
              </div>
            )}

            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "8px",
              border: `1.5px dashed ${logoFile ? "rgba(77,201,138,0.5)" : "rgba(201,151,58,0.25)"}`,
              borderRadius: "10px", padding: "20px",
              cursor: "pointer", background: logoFile ? "rgba(30,120,70,0.08)" : "transparent",
              transition: "all 0.2s ease",
            }}>
              <input type="file" accept="image/*"
                style={{ display: "none" }}
                onChange={e => setLogoFile(e.target.files[0] || null)} />
              <span style={{ fontSize: "22px" }}>🏢</span>
              <span style={{ fontSize: "13px", color: logoFile ? "#4DC98A" : "#9A9489" }}>
                {logoFile ? logoFile.name : "Click to upload logo"}
              </span>
            </label>
          </div>

          {error && (
            <div style={{ background: "rgba(200,60,60,0.12)", border: "0.5px solid rgba(200,60,60,0.4)", borderRadius: "8px", padding: "10px 14px", color: "#E07070", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSave} disabled={saving} style={{
              background: saving ? "rgba(201,151,58,0.4)" : "#C9973A", color: "#2C2C2E",
              border: "none", borderRadius: "10px", padding: "11px 24px",
              fontSize: "13px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer",
            }}>
              {uploading ? "Uploading..." : saving ? "Saving..." : editId ? "Save changes" : "Add developer"}
            </button>
            <button onClick={cancelForm} style={{
              background: "transparent", color: "#9A9489",
              border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: "10px",
              padding: "11px 20px", fontSize: "13px", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#9A9489", fontSize: "14px" }}>Loading...</p>
      ) : developers.length === 0 ? (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <p style={{ color: "#6B6762", fontSize: "14px", margin: 0 }}>No developers yet.</p>
        </div>
      ) : (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)", borderRadius: "12px", overflow: "hidden" }}>
          {developers.map((dev, i) => (
            <div key={dev.id} style={{
              display: "flex", alignItems: "center", gap: "16px",
              padding: "16px 20px",
              borderBottom: i < developers.length - 1 ? "0.5px solid rgba(201,151,58,0.1)" : "none",
            }}>
              {/* Avatar / logo */}
              <div style={{
                width: "44px", height: "44px", borderRadius: "999px", flexShrink: 0,
                background: "rgba(201,151,58,0.15)", border: "0.5px solid rgba(201,151,58,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", color: "#C9973A", fontFamily: "Georgia, serif", fontWeight: "bold",
                overflow: "hidden",
              }}>
                {dev.logo_url ? (
                  <img src={dev.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  dev.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", color: "#F0EDE6", fontWeight: "500" }}>{dev.name}</div>
                {dev.bio && (
                  <div style={{ fontSize: "12px", color: "#6B6762", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {dev.bio}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button onClick={() => openEdit(dev)} style={{
                  background: "transparent", border: "0.5px solid rgba(201,151,58,0.25)",
                  borderRadius: "8px", padding: "7px 14px", color: "#C9973A", fontSize: "12px", cursor: "pointer",
                }}>Edit</button>
                <button onClick={() => handleDelete(dev.id)} disabled={deletingId === dev.id} style={{
                  background: "transparent", border: "0.5px solid rgba(200,60,60,0.3)",
                  borderRadius: "8px", padding: "7px 14px", color: "#E07070", fontSize: "12px", cursor: "pointer",
                }}>
                  {deletingId === dev.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}