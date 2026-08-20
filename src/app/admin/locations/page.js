"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const emptyForm = { name: "", description: "", image_url: "" };

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function fetchLocations() {
    const { data } = await supabase.from("locations").select("*").order("created_at", { ascending: false });
    setLocations(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchLocations(); }, []);

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setError("");
    setImageFile(null);
    setShowForm(true);
  }

  function openEdit(loc) {
    setForm({ name: loc.name || "", description: loc.description || "", image_url: loc.image_url || "" });
    setEditId(loc.id);
    setError("");
    setImageFile(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setForm(emptyForm);
    setEditId(null);
    setError("");
    setImageFile(null);
  }

  async function uploadImage(file) {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("location-images").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("location-images").getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");

    let finalImageUrl = form.image_url.trim() || null;

    if (imageFile) {
      setUploading(true);
      try {
        finalImageUrl = await uploadImage(imageFile);
      } catch (err) {
        setError("Image upload failed: " + err.message);
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (editId) {
      const { error } = await supabase.from("locations").update({
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: finalImageUrl,
      }).eq("id", editId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("locations").insert({
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: finalImageUrl,
      });
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    cancelForm();
    fetchLocations();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this location? This cannot be undone.")) return;
    setDeletingId(id);
    await supabase.from("locations").delete().eq("id", id);
    setDeletingId(null);
    fetchLocations();
  }

  const inputStyle = {
    width: "100%",
    background: "#3A3A3D",
    border: "0.5px solid rgba(201,151,58,0.25)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "#F0EDE6",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Inter, Arial, sans-serif",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    color: "#9A9489",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "7px",
  };

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : form.image_url;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#F0EDE6", margin: 0, marginBottom: "5px" }}>
            Locations
          </h1>
          <p style={{ color: "#9A9489", fontSize: "13px", margin: 0 }}>{locations.length} location{locations.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} style={{
          background: "#C9973A", color: "#2C2C2E", border: "none", borderRadius: "10px",
          padding: "11px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
        }}>
          + Add location
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: "#343437", border: "0.5px solid rgba(201,151,58,0.3)",
          borderRadius: "14px", padding: "28px", marginBottom: "28px",
        }}>
          <h2 style={{ fontSize: "16px", color: "#F0EDE6", margin: "0 0 22px", fontWeight: "500" }}>
            {editId ? "Edit location" : "New location"}
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. El Tagamoa" />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description shown on the location card..." />
          </div>

          {/* Cover image upload */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Cover Image</label>

            {previewUrl && (
              <div style={{ marginBottom: "12px" }}>
                <img src={previewUrl} alt="" style={{
                  width: "160px", height: "100px", objectFit: "cover",
                  borderRadius: "8px", border: "0.5px solid rgba(201,151,58,0.2)",
                }} />
              </div>
            )}

            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "8px",
              border: `1.5px dashed ${imageFile ? "rgba(77,201,138,0.5)" : "rgba(201,151,58,0.25)"}`,
              borderRadius: "10px", padding: "20px",
              cursor: "pointer", background: imageFile ? "rgba(30,120,70,0.08)" : "transparent",
              transition: "all 0.2s ease",
            }}>
              <input type="file" accept="image/*"
                style={{ display: "none" }}
                onChange={e => setImageFile(e.target.files[0] || null)} />
              <span style={{ fontSize: "22px" }}>📸</span>
              <span style={{ fontSize: "13px", color: imageFile ? "#4DC98A" : "#9A9489" }}>
                {imageFile ? imageFile.name : "Click to upload cover image"}
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
              {uploading ? "Uploading..." : saving ? "Saving..." : editId ? "Save changes" : "Add location"}
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

      {/* Table */}
      {loading ? (
        <p style={{ color: "#9A9489", fontSize: "14px" }}>Loading...</p>
      ) : locations.length === 0 ? (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <p style={{ color: "#6B6762", fontSize: "14px", margin: 0 }}>No locations yet. Add your first one above.</p>
        </div>
      ) : (
        <div style={{ background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)", borderRadius: "12px", overflow: "hidden" }}>
          {locations.map((loc, i) => (
            <div key={loc.id} style={{
              display: "flex", alignItems: "center", gap: "16px",
              padding: "16px 20px",
              borderBottom: i < locations.length - 1 ? "0.5px solid rgba(201,151,58,0.1)" : "none",
            }}>
              {/* Thumb */}
              <div style={{
                width: "48px", height: "48px", borderRadius: "8px", flexShrink: 0,
                background: "#3A3A3D", overflow: "hidden",
                border: "0.5px solid rgba(201,151,58,0.15)",
              }}>
                {loc.image_url ? (
                  <img src={loc.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6762", fontSize: "18px" }}>📍</div>
                )}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", color: "#F0EDE6", fontWeight: "500" }}>{loc.name}</div>
                {loc.description && (
                  <div style={{ fontSize: "12px", color: "#6B6762", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {loc.description}
                  </div>
                )}
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button onClick={() => openEdit(loc)} style={{
                  background: "transparent", border: "0.5px solid rgba(201,151,58,0.25)",
                  borderRadius: "8px", padding: "7px 14px", color: "#C9973A",
                  fontSize: "12px", cursor: "pointer",
                }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(loc.id)} disabled={deletingId === loc.id} style={{
                  background: "transparent", border: "0.5px solid rgba(200,60,60,0.3)",
                  borderRadius: "8px", padding: "7px 14px", color: "#E07070",
                  fontSize: "12px", cursor: "pointer",
                }}>
                  {deletingId === loc.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}