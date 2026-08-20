"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const emptyForm = {
  title: "", location_id: "", developer_id: "", price: "",
  area_sqm: "", price_per_meter: "", status: "available", description: "",
  location_url: "", contact_whatsapp: "", contact_phone: "",
  customize_plan_whatsapp: "", developer_whatsapp: "", down_payment_amount: "", amman_whatsapp: "",
};

const emptyNewArea = { area_sqm: "", status: "available", bedrooms: "", unit_label: "" };
const emptyNewPlan = { label: "", down_payment_percent: "", years: "" };

const statusColors = {
  available: { color: "#4DC98A", bg: "rgba(30,120,70,0.18)" },
  reserved: { color: "#E8C97A", bg: "rgba(200,150,40,0.12)" },
  sold: { color: "#E07070", bg: "rgba(200,60,60,0.12)" },
};

function priceKey(areaId, planId) {
  return `${areaId}_${planId}`;
}

export default function AdminLands() {
  const [lands, setLands] = useState([]);
  const [locations, setLocations] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [lastLand, setLastLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [settingThumbId, setSettingThumbId] = useState(null);

  // Masterplan images — separate gallery, mirrors the regular image upload
  // pattern above but writes is_masterplan: true and has no thumbnail concept.
  const [masterplanFiles, setMasterplanFiles] = useState([]);
  const [existingMasterplanImages, setExistingMasterplanImages] = useState([]);
  const [deletingMasterplanImageId, setDeletingMasterplanImageId] = useState(null);

  // Area options / installment plans / price grid
  const [areaOptions, setAreaOptions] = useState([]);
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [priceGrid, setPriceGrid] = useState({});
  const [newArea, setNewArea] = useState(emptyNewArea);
  const [newPlan, setNewPlan] = useState(emptyNewPlan);

  async function fetchAll() {
    const [{ data: landsData }, { data: locsData }, { data: devsData }, { data: lastLandData }] = await Promise.all([
      supabase.from("lands").select("*, locations(name), developers(name)").order("created_at", { ascending: false }),
      supabase.from("locations").select("id, name").order("name"),
      supabase.from("developers").select("id, name").order("name"),
      supabase.from("lands").select("*").order("created_at", { ascending: false }).limit(1).single(),
    ]);
    setLands(landsData || []);
    setLocations(locsData || []);
    setDevelopers(devsData || []);
    setLastLand(lastLandData || null);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAreasPlansPrices(landId) {
    const [{ data: areas }, { data: plans }] = await Promise.all([
      supabase.from("land_areas").select("*").eq("land_id", landId).order("created_at"),
      supabase.from("land_installment_plans").select("*").eq("land_id", landId).order("created_at"),
    ]);
    const areaList = areas || [];
    const planList = plans || [];

    setAreaOptions(areaList.map(a => ({
      id: a.id, area_sqm: a.area_sqm, status: a.status,
      bedrooms: a.bedrooms ?? null, unit_label: a.unit_label ?? "", _new: false,
    })));
    setInstallmentPlans(planList.map(p => ({
      id: p.id, label: p.label, down_payment_percent: p.down_payment_percent, years: p.years, _new: false,
    })));

    const areaIds = areaList.map(a => a.id);
    if (areaIds.length > 0) {
      const { data: prices } = await supabase
        .from("land_area_plan_prices")
        .select("*")
        .in("land_area_id", areaIds);
      const grid = {};
      (prices || []).forEach(p => {
        grid[priceKey(p.land_area_id, p.installment_plan_id)] = String(p.total_price);
      });
      setPriceGrid(grid);
    } else {
      setPriceGrid({});
    }
  }

  function openAdd() {
    setForm(emptyForm); setEditId(null); setError("");
    setImageFiles([]); setExistingImages([]); setThumbnailUrl(null);
    setMasterplanFiles([]); setExistingMasterplanImages([]);
    setAreaOptions([]); setInstallmentPlans([]); setPriceGrid({});
    setNewArea(emptyNewArea); setNewPlan(emptyNewPlan);
    setShowForm(true);
    setTimeout(() => document.getElementById("land-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function openEdit(land) {
    setForm({
      title: land.title || "", location_id: land.location_id || "",
      developer_id: land.developer_id || "", price: land.price || "",
      area_sqm: land.area_sqm || "", price_per_meter: land.price_per_meter || "",
      status: land.status || "available",
      description: land.description || "", location_url: land.location_url || "",
      contact_whatsapp: land.contact_whatsapp || "",
      contact_phone: land.contact_phone || "",
      customize_plan_whatsapp: land.customize_plan_whatsapp || "",
      developer_whatsapp: land.developer_whatsapp || "",
      down_payment_amount: land.down_payment_amount ?? "",
      amman_whatsapp: land.amman_whatsapp || "",
    });
    setEditId(land.id); setError(""); setImageFiles([]); setMasterplanFiles([]);
    setThumbnailUrl(land.image_url || null);
    const { data: imgs } = await supabase.from("land_images").select("*").eq("land_id", land.id);
    const allImgs = imgs || [];
    setExistingImages(allImgs.filter(i => !i.is_masterplan));
    setExistingMasterplanImages(allImgs.filter(i => i.is_masterplan));
    setNewArea(emptyNewArea); setNewPlan(emptyNewPlan);
    await fetchAreasPlansPrices(land.id);
    setShowForm(true);
    setTimeout(() => document.getElementById("land-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function cancelForm() {
    setShowForm(false); setForm(emptyForm); setEditId(null);
    setError(""); setImageFiles([]); setExistingImages([]); setThumbnailUrl(null);
    setMasterplanFiles([]); setExistingMasterplanImages([]);
    setAreaOptions([]); setInstallmentPlans([]); setPriceGrid({});
    setNewArea(emptyNewArea); setNewPlan(emptyNewPlan);
  }

  async function uploadImages(landId, files) {
    const urls = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `lands/${landId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("land-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("land-images").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  }

  async function uploadMasterplanImages(landId, files) {
    const urls = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `lands/${landId}/masterplan/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("land-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("land-images").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  }

  // ---- Area options ----
  async function addAreaOption() {
    if (!newArea.area_sqm) return;
    const areaPayload = {
      area_sqm: parseFloat(newArea.area_sqm),
      status: newArea.status,
      bedrooms: parseInt(newArea.bedrooms) || null,
      unit_label: newArea.unit_label.trim() || null,
    };
    if (editId) {
      const { data, error } = await supabase
        .from("land_areas")
        .insert({ land_id: editId, ...areaPayload })
        .select()
        .single();
      if (error) { setError(error.message); return; }
      setAreaOptions(prev => [...prev, {
        id: data.id, area_sqm: data.area_sqm, status: data.status,
        bedrooms: data.bedrooms, unit_label: data.unit_label ?? "", _new: false,
      }]);
    } else {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setAreaOptions(prev => [...prev, { id: tempId, ...areaPayload, _new: true }]);
    }
    setNewArea(emptyNewArea);
  }

  async function removeAreaOption(area) {
    if (!area._new && editId) {
      await supabase.from("land_areas").delete().eq("id", area.id);
    }
    setAreaOptions(prev => prev.filter(a => a.id !== area.id));
    setPriceGrid(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => { if (key.startsWith(`${area.id}_`)) delete next[key]; });
      return next;
    });
  }

  async function updateAreaRow(area, updates) {
    if (!area._new && editId) {
      await supabase.from("land_areas").update(updates).eq("id", area.id);
    }
    setAreaOptions(prev => prev.map(a => (a.id === area.id ? { ...a, ...updates } : a)));
  }

  function handleAreaBedroomsInput(area, value) {
    setAreaOptions(prev => prev.map(a => (a.id === area.id ? { ...a, bedrooms: value } : a)));
  }

  function handleAreaBedroomsBlur(area) {
    const bedrooms = area.bedrooms === "" || area.bedrooms === null || area.bedrooms === undefined
      ? null
      : parseInt(area.bedrooms) || null;
    updateAreaRow(area, { bedrooms });
  }

  function handleAreaUnitLabelInput(area, value) {
    setAreaOptions(prev => prev.map(a => (a.id === area.id ? { ...a, unit_label: value } : a)));
  }

  function handleAreaUnitLabelBlur(area) {
    const unit_label = area.unit_label && area.unit_label.trim() ? area.unit_label.trim() : null;
    updateAreaRow(area, { unit_label });
  }

  // ---- Installment plans ----
  async function addInstallmentPlan() {
    if (!newPlan.label.trim() || newPlan.down_payment_percent === "" || newPlan.years === "") return;
    const planPayload = {
      label: newPlan.label.trim(),
      down_payment_percent: parseFloat(newPlan.down_payment_percent),
      years: parseFloat(newPlan.years),
    };
    if (editId) {
      const { data, error } = await supabase
        .from("land_installment_plans")
        .insert({ land_id: editId, ...planPayload })
        .select()
        .single();
      if (error) { setError(error.message); return; }
      setInstallmentPlans(prev => [...prev, { id: data.id, ...planPayload, _new: false }]);
    } else {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setInstallmentPlans(prev => [...prev, { id: tempId, ...planPayload, _new: true }]);
    }
    setNewPlan(emptyNewPlan);
  }

  async function removeInstallmentPlan(plan) {
    if (!plan._new && editId) {
      await supabase.from("land_installment_plans").delete().eq("id", plan.id);
    }
    setInstallmentPlans(prev => prev.filter(p => p.id !== plan.id));
    setPriceGrid(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => { if (key.endsWith(`_${plan.id}`)) delete next[key]; });
      return next;
    });
  }

  // ---- Price grid ----
  function handlePriceChange(areaId, planId, value) {
    setPriceGrid(prev => ({ ...prev, [priceKey(areaId, planId)]: value }));
  }

  async function handlePriceBlur(areaId, planId) {
    if (!editId) return; // brand-new project: committed later, inside handleSave
    const value = priceGrid[priceKey(areaId, planId)];
    if (value === undefined || value === "") return;
    const totalPrice = parseFloat(value);
    if (Number.isNaN(totalPrice)) return;
    await supabase.from("land_area_plan_prices").upsert(
      { land_area_id: areaId, installment_plan_id: planId, total_price: totalPrice },
      { onConflict: "land_area_id,installment_plan_id" }
    );
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.location_id) { setError("Location is required."); return; }
    if (!form.developer_id) { setError("Developer is required."); return; }
    setSaving(true); setError("");

    const payload = {
      title: form.title.trim(),
      location_id: form.location_id,
      developer_id: form.developer_id,
      price: form.price ? parseFloat(form.price) : null,
      area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
      price_per_meter: form.price_per_meter ? parseFloat(form.price_per_meter) : null,
      status: form.status,
      description: form.description.trim() || null,
      location_url: form.location_url.trim() || null,
      contact_whatsapp: form.contact_whatsapp.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      customize_plan_whatsapp: form.customize_plan_whatsapp.trim() || null,
      developer_whatsapp: form.developer_whatsapp.trim() || null,
      down_payment_amount: form.down_payment_amount ? parseFloat(form.down_payment_amount) : null,
      amman_whatsapp: form.amman_whatsapp.trim() || null,
    };

    let landId = editId;
    let finalThumbnail = thumbnailUrl; // preserve existing thumbnail

    if (editId) {
      const { error } = await supabase.from("lands").update(payload).eq("id", editId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("lands").insert(payload).select().single();
      if (error) { setError(error.message); setSaving(false); return; }
      landId = data.id;
    }

    // Brand-new project: areas/plans/price-grid were staged locally — commit now that landId is known
    if (!editId) {
      const areaIdMap = {};
      const planIdMap = {};

      if (areaOptions.length > 0) {
        const { data: insertedAreas, error: areaErr } = await supabase
          .from("land_areas")
          .insert(areaOptions.map(a => ({
            land_id: landId, area_sqm: a.area_sqm, status: a.status,
            bedrooms: a.bedrooms ?? null, unit_label: a.unit_label || null,
          })))
          .select();
        if (areaErr) { setError("Project saved but area options failed: " + areaErr.message); setSaving(false); return; }
        insertedAreas.forEach((row, idx) => { areaIdMap[areaOptions[idx].id] = row.id; });
      }

      if (installmentPlans.length > 0) {
        const { data: insertedPlans, error: planErr } = await supabase
          .from("land_installment_plans")
          .insert(installmentPlans.map(p => ({
            land_id: landId, label: p.label, down_payment_percent: p.down_payment_percent, years: p.years,
          })))
          .select();
        if (planErr) { setError("Project saved but installment plans failed: " + planErr.message); setSaving(false); return; }
        insertedPlans.forEach((row, idx) => { planIdMap[installmentPlans[idx].id] = row.id; });
      }

      const priceRows = [];
      Object.entries(priceGrid).forEach(([key, value]) => {
        if (value === "" || value === undefined) return;
        const [tempAreaId, tempPlanId] = key.split("_");
        const realAreaId = areaIdMap[tempAreaId];
        const realPlanId = planIdMap[tempPlanId];
        if (realAreaId && realPlanId) {
          priceRows.push({ land_area_id: realAreaId, installment_plan_id: realPlanId, total_price: parseFloat(value) });
        }
      });
      if (priceRows.length > 0) {
        const { error: priceErr } = await supabase.from("land_area_plan_prices").insert(priceRows);
        if (priceErr) { setError("Project saved but price grid failed: " + priceErr.message); setSaving(false); return; }
      }
    }

    // Upload new regular gallery images and/or new masterplan images if selected
    if (imageFiles.length > 0 || masterplanFiles.length > 0) {
      setUploadingImages(true);

      if (imageFiles.length > 0) {
        const urls = await uploadImages(landId, imageFiles);
        if (urls.length > 0) {
          const imageRows = urls.map(url => ({ land_id: landId, image_url: url, is_masterplan: false }));
          const { error: insertErr } = await supabase.from("land_images").insert(imageRows);
          if (insertErr) {
            setError("Images uploaded but failed to save: " + insertErr.message);
            setSaving(false); setUploadingImages(false); return;
          }
          // Only set thumbnail from new upload if no thumbnail exists yet
          if (!finalThumbnail) {
            finalThumbnail = urls[0];
          }
        }
      }

      if (masterplanFiles.length > 0) {
        const mpUrls = await uploadMasterplanImages(landId, masterplanFiles);
        if (mpUrls.length > 0) {
          const mpRows = mpUrls.map(url => ({ land_id: landId, image_url: url, is_masterplan: true }));
          const { error: mpInsertErr } = await supabase.from("land_images").insert(mpRows);
          if (mpInsertErr) {
            setError("Project saved but masterplan images failed to save: " + mpInsertErr.message);
            setSaving(false); setUploadingImages(false); return;
          }
        }
      }

      setUploadingImages(false);
    }

    // Always sync image_url on the lands row — unconditional
    const { error: thumbErr } = await supabase
      .from("lands")
      .update({ image_url: finalThumbnail })
      .eq("id", landId);

    if (thumbErr) {
      setError("Project saved but thumbnail failed to update: " + thumbErr.message);
      setSaving(false); return;
    }

    setSaving(false); cancelForm(); fetchAll();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(id);
    await supabase.from("land_images").delete().eq("land_id", id);
    await supabase.from("lands").delete().eq("id", id);
    setDeletingId(null); fetchAll();
  }

  async function handleDeleteImage(img) {
    setDeletingImageId(img.id);
    await supabase.from("land_images").delete().eq("id", img.id);
    setExistingImages(prev => prev.filter(i => i.id !== img.id));
    if (thumbnailUrl === img.image_url) setThumbnailUrl(null);
    setDeletingImageId(null);
  }

  async function handleDeleteMasterplanImage(img) {
    setDeletingMasterplanImageId(img.id);
    await supabase.from("land_images").delete().eq("id", img.id);
    setExistingMasterplanImages(prev => prev.filter(i => i.id !== img.id));
    setDeletingMasterplanImageId(null);
  }

  async function handleSetThumbnail(url, key) {
    setSettingThumbId(key);
    setThumbnailUrl(url);
    if (editId) {
      await supabase.from("lands").update({ image_url: url }).eq("id", editId);
    }
    setSettingThumbId(null);
  }

  const inputStyle = {
    width: "100%", background: "#3A3A3D",
    border: "0.5px solid rgba(201,151,58,0.25)", borderRadius: "10px",
    padding: "11px 14px", color: "#F0EDE6", fontSize: "14px",
    outline: "none", boxSizing: "border-box", fontFamily: "Inter, Arial, sans-serif",
  };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const labelStyle = {
    display: "block", fontSize: "11px", color: "#9A9489",
    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "7px",
  };
  const rowLabelStyle = {
    fontSize: "9px", color: "#6B6762", marginBottom: "4px",
    textTransform: "uppercase", letterSpacing: "0.08em",
  };
  const gridTwo = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", color: "#F0EDE6", margin: 0, marginBottom: "5px" }}>Projects</h1>
          <p style={{ color: "#9A9489", fontSize: "13px", margin: 0 }}>{lands.length} project{lands.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd} style={{
          background: "#C9973A", color: "#2C2C2E", border: "none", borderRadius: "10px",
          padding: "11px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
        }}>
          + Add project
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div id="land-form" style={{
          background: "#343437", border: "0.5px solid rgba(201,151,58,0.3)",
          borderRadius: "14px", padding: "28px", marginBottom: "28px",
        }}>
          <h2 style={{ fontSize: "16px", color: "#F0EDE6", margin: "0 0 24px", fontWeight: "500" }}>
            {editId ? "Edit project" : "New project"}
          </h2>

          {/* Title */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Project Title *</label>
            <input style={inputStyle} value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={lastLand?.title ?? ""} />
          </div>

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>Location *</label>
              <select style={selectStyle} value={form.location_id}
                onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}>
                <option value="">Select location...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Developer *</label>
              <select style={selectStyle} value={form.developer_id}
                onChange={e => setForm(f => ({ ...f, developer_id: e.target.value }))}>
                <option value="">Select developer...</option>
                {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>Price (EGP)</label>
              <input style={inputStyle} type="number" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder={lastLand?.price ?? ""} />
            </div>
            <div>
              <label style={labelStyle}>Area (m²)</label>
              <input style={inputStyle} type="number" value={form.area_sqm}
                onChange={e => setForm(f => ({ ...f, area_sqm: e.target.value }))}
                placeholder={lastLand?.area_sqm ?? ""} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Price per m² (EGP)</label>
            <input style={inputStyle} type="number" value={form.price_per_meter}
              onChange={e => setForm(f => ({ ...f, price_per_meter: e.target.value }))}
              placeholder={lastLand?.price_per_meter ?? ""} />
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "6px 0 0" }}>
              Constant for the whole project — shown on the project details page regardless of which
              size/plan the buyer picks.
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Down Payment Amount (EGP)</label>
            <input style={inputStyle} type="number" value={form.down_payment_amount}
              onChange={e => setForm(f => ({ ...f, down_payment_amount: e.target.value }))}
              placeholder={lastLand?.down_payment_amount ?? ""} />
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "6px 0 0" }}>
              Shown as the deposit on the Down Payment screen.
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Status</label>
            <select style={selectStyle} value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={lastLand?.description ?? ""} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Location URL</label>
            <input style={inputStyle} type="url" value={form.location_url}
              onChange={e => setForm(f => ({ ...f, location_url: e.target.value }))}
              placeholder={lastLand?.location_url ?? ""} />
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "6px 0 0" }}>
              Paste a Google Maps link (share → copy link). Buyers tap "View on Google Maps" and are
              taken straight to this URL.
            </p>
          </div>

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>WhatsApp Number</label>
              <input style={inputStyle} value={form.contact_whatsapp}
                onChange={e => setForm(f => ({ ...f, contact_whatsapp: e.target.value }))}
                placeholder={lastLand?.contact_whatsapp ?? ""} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input style={inputStyle} value={form.contact_phone}
                onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                placeholder={lastLand?.contact_phone ?? ""} />
            </div>
          </div>

          {/* Contact Numbers section */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Contact Numbers</label>
            <div style={{ ...gridTwo, marginTop: "10px", marginBottom: 0 }}>
              <div>
                <label style={{ ...labelStyle, fontSize: "10px" }}>Developer WhatsApp</label>
                <input style={inputStyle} value={form.developer_whatsapp}
                  onChange={e => setForm(f => ({ ...f, developer_whatsapp: e.target.value }))}
                  placeholder={lastLand?.developer_whatsapp ?? ""} />
                <p style={{ fontSize: "11px", color: "#6B6762", margin: "6px 0 0" }}>
                  Opens when the buyer taps WhatsApp the Developer on the project page.
                </p>
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: "10px" }}>Amman — WhatsApp</label>
                <input style={inputStyle} value={form.amman_whatsapp}
                  onChange={e => setForm(f => ({ ...f, amman_whatsapp: e.target.value }))}
                  placeholder={lastLand?.amman_whatsapp ?? ""} />
                <p style={{ fontSize: "11px", color: "#6B6762", margin: "6px 0 0" }}>
                  Opens when the buyer requests the Amman payment collection service.
                </p>
              </div>
            </div>
          </div>

          {/* Image upload section */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Project Images</label>
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "0 0 12px" }}>
              {thumbnailUrl
                ? "Current thumbnail is marked with a gold border. Click any image below to set it as thumbnail."
                : "No thumbnail set yet — the first uploaded image becomes the thumbnail automatically."}
            </p>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
                {existingImages.map(img => {
                  const isThumb = thumbnailUrl === img.image_url;
                  return (
                    <div key={img.id} style={{ position: "relative", width: "100px" }}>
                      <img src={img.image_url} alt="" style={{
                        width: "100px", height: "70px", objectFit: "cover",
                        borderRadius: "8px",
                        border: isThumb ? "2px solid #C9973A" : "0.5px solid rgba(201,151,58,0.2)",
                      }} />
                      <button
                        onClick={() => handleDeleteImage(img)}
                        disabled={deletingImageId === img.id}
                        style={{
                          position: "absolute", top: "-6px", right: "-6px",
                          background: "#E07070", border: "none", borderRadius: "999px",
                          width: "18px", height: "18px", cursor: "pointer",
                          color: "#fff", fontSize: "11px", lineHeight: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        ×
                      </button>
                      <button
                        onClick={() => handleSetThumbnail(img.image_url, img.id)}
                        disabled={isThumb || settingThumbId === img.id}
                        style={{
                          width: "100%", marginTop: "5px",
                          background: isThumb ? "rgba(201,151,58,0.15)" : "transparent",
                          border: `0.5px solid ${isThumb ? "rgba(201,151,58,0.4)" : "rgba(201,151,58,0.2)"}`,
                          borderRadius: "6px", padding: "4px 2px",
                          color: isThumb ? "#E8C97A" : "#9A9489",
                          fontSize: "10px", cursor: isThumb ? "default" : "pointer",
                        }}>
                        {isThumb ? "★ Thumbnail" : settingThumbId === img.id ? "..." : "Set as thumbnail"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* New upload */}
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "8px",
              border: `1.5px dashed ${imageFiles.length > 0 ? "rgba(77,201,138,0.5)" : "rgba(201,151,58,0.25)"}`,
              borderRadius: "10px", padding: "20px",
              cursor: "pointer",
              background: imageFiles.length > 0 ? "rgba(30,120,70,0.08)" : "transparent",
              transition: "all 0.2s ease",
            }}>
              <input type="file" multiple accept="image/*"
                style={{ display: "none" }}
                onChange={e => setImageFiles(Array.from(e.target.files))} />
              <span style={{ fontSize: "22px" }}>📸</span>
              <span style={{ fontSize: "13px", color: imageFiles.length > 0 ? "#4DC98A" : "#9A9489" }}>
                {imageFiles.length > 0
                  ? `${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} selected`
                  : "Click to upload images"}
              </span>
              <span style={{ fontSize: "11px", color: "#6B6762" }}>
                {existingImages.length === 0 && !thumbnailUrl
                  ? "First image becomes the thumbnail automatically"
                  : "New images are added to the gallery"}
              </span>
            </label>
          </div>

          {/* Masterplan Photos section — separate gallery, same pattern as above,
              writes is_masterplan: true. Shown at the top of the buyer's unit picker;
              omitted from that view entirely if left empty. */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Masterplan Photos</label>
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "0 0 12px" }}>
              Shown at the top of the unit picker when a buyer selects a size. Leave empty to skip
              that section on the buyer-facing page.
            </p>

            {existingMasterplanImages.length > 0 && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
                {existingMasterplanImages.map(img => (
                  <div key={img.id} style={{ position: "relative", width: "100px" }}>
                    <img src={img.image_url} alt="" style={{
                      width: "100px", height: "70px", objectFit: "cover",
                      borderRadius: "8px", border: "0.5px solid rgba(201,151,58,0.2)",
                    }} />
                    <button
                      onClick={() => handleDeleteMasterplanImage(img)}
                      disabled={deletingMasterplanImageId === img.id}
                      style={{
                        position: "absolute", top: "-6px", right: "-6px",
                        background: "#E07070", border: "none", borderRadius: "999px",
                        width: "18px", height: "18px", cursor: "pointer",
                        color: "#fff", fontSize: "11px", lineHeight: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "8px",
              border: `1.5px dashed ${masterplanFiles.length > 0 ? "rgba(77,201,138,0.5)" : "rgba(201,151,58,0.25)"}`,
              borderRadius: "10px", padding: "20px",
              cursor: "pointer",
              background: masterplanFiles.length > 0 ? "rgba(30,120,70,0.08)" : "transparent",
              transition: "all 0.2s ease",
            }}>
              <input type="file" multiple accept="image/*"
                style={{ display: "none" }}
                onChange={e => setMasterplanFiles(Array.from(e.target.files))} />
              <span style={{ fontSize: "22px" }}>🗺️</span>
              <span style={{ fontSize: "13px", color: masterplanFiles.length > 0 ? "#4DC98A" : "#9A9489" }}>
                {masterplanFiles.length > 0
                  ? `${masterplanFiles.length} image${masterplanFiles.length > 1 ? "s" : ""} selected`
                  : "Click to upload masterplan images"}
              </span>
            </label>
          </div>

          {/* Area options manager */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Available Area Options</label>
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "0 0 12px" }}>
              Plot sizes buyers can choose from for this project. Price/m² above stays constant — only
              status varies per size. Each row is one physical unit — give it an optional label
              (e.g. "Villa 3") so buyers can tell same-size units apart in the unit picker.
            </p>

            {areaOptions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {areaOptions.map(area => {
                  const s = statusColors[area.status] || statusColors.available;
                  return (
                    <div key={area.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        flex: 1, background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.2)",
                        borderRadius: "8px", padding: "9px 14px", fontSize: "13px", color: "#F0EDE6",
                      }}>
                        {area.unit_label ? `${area.unit_label} — ` : ""}
                        {Number(area.area_sqm).toLocaleString()} m²{area.bedrooms ? ` · ${area.bedrooms} bed` : ""}
                      </div>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <div style={{ width: "120px", flexShrink: 0 }}>
                        <div style={rowLabelStyle}>Label</div>
                        <input
                          type="text"
                          value={area.unit_label ?? ""}
                          onChange={e => handleAreaUnitLabelInput(area, e.target.value)}
                          onBlur={() => handleAreaUnitLabelBlur(area)}
                          placeholder="e.g. Villa 3"
                          style={{ ...inputStyle, padding: "9px 10px", fontSize: "13px" }}
                        />
                      </div>
                      <div style={{ width: "80px", flexShrink: 0 }}>
                        <div style={rowLabelStyle}>Beds</div>
                        <input
                          type="number"
                          value={area.bedrooms ?? ""}
                          onChange={e => handleAreaBedroomsInput(area, e.target.value)}
                          onBlur={() => handleAreaBedroomsBlur(area)}
                          placeholder="0"
                          style={{ ...inputStyle, padding: "9px 10px", fontSize: "13px" }}
                        />
                      </div>
                      <select style={{ ...selectStyle, width: "140px" }} value={area.status}
                        onChange={e => updateAreaRow(area, { status: e.target.value })}>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                      </select>
                      <button onClick={() => removeAreaOption(area)} style={{
                        background: "transparent", border: "0.5px solid rgba(200,60,60,0.3)",
                        borderRadius: "8px", padding: "7px 12px", color: "#E07070", fontSize: "12px",
                        cursor: "pointer", flexShrink: 0,
                      }}>
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <input style={{ ...inputStyle, flex: 1 }} type="number" value={newArea.area_sqm}
                onChange={e => setNewArea(a => ({ ...a, area_sqm: e.target.value }))}
                placeholder="e.g. 400 (m²)" />
              <div style={{ width: "120px", flexShrink: 0 }}>
                <div style={rowLabelStyle}>Label</div>
                <input style={inputStyle} type="text" value={newArea.unit_label}
                  onChange={e => setNewArea(a => ({ ...a, unit_label: e.target.value }))}
                  placeholder="e.g. Villa 3" />
              </div>
              <div style={{ width: "80px", flexShrink: 0 }}>
                <div style={rowLabelStyle}>Beds</div>
                <input style={inputStyle} type="number" value={newArea.bedrooms}
                  onChange={e => setNewArea(a => ({ ...a, bedrooms: e.target.value }))}
                  placeholder="0" />
              </div>
              <select style={{ ...selectStyle, width: "140px" }} value={newArea.status}
                onChange={e => setNewArea(a => ({ ...a, status: e.target.value }))}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
              <button onClick={addAreaOption} style={{
                background: "rgba(201,151,58,0.12)", border: "0.5px solid rgba(201,151,58,0.4)",
                borderRadius: "8px", padding: "9px 16px", color: "#E8C97A", fontSize: "12px",
                fontWeight: "600", cursor: "pointer", flexShrink: 0,
              }}>
                + Add size
              </button>
            </div>
          </div>

          {/* Installment plans manager */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Installment Plans</label>
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "0 0 12px" }}>
              Payment plans buyers can choose from for this project.
            </p>

            {installmentPlans.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {installmentPlans.map(plan => (
                  <div key={plan.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      flex: 1, background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.2)",
                      borderRadius: "8px", padding: "9px 14px", fontSize: "13px", color: "#F0EDE6",
                    }}>
                      {plan.label} · {plan.down_payment_percent}% down · {plan.years} yrs
                    </div>
                    <button onClick={() => removeInstallmentPlan(plan)} style={{
                      background: "transparent", border: "0.5px solid rgba(200,60,60,0.3)",
                      borderRadius: "8px", padding: "7px 12px", color: "#E07070", fontSize: "12px",
                      cursor: "pointer", flexShrink: 0,
                    }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: "2 1 160px" }} value={newPlan.label}
                onChange={e => setNewPlan(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. 10% Down — 5 Years" />
              <input style={{ ...inputStyle, flex: "1 1 100px" }} type="number" value={newPlan.down_payment_percent}
                onChange={e => setNewPlan(p => ({ ...p, down_payment_percent: e.target.value }))}
                placeholder="Down %" />
              <input style={{ ...inputStyle, flex: "1 1 80px" }} type="number" value={newPlan.years}
                onChange={e => setNewPlan(p => ({ ...p, years: e.target.value }))}
                placeholder="Years" />
              <button onClick={addInstallmentPlan} style={{
                background: "rgba(201,151,58,0.12)", border: "0.5px solid rgba(201,151,58,0.4)",
                borderRadius: "8px", padding: "9px 16px", color: "#E8C97A", fontSize: "12px",
                fontWeight: "600", cursor: "pointer", flexShrink: 0,
              }}>
                + Add plan
              </button>
            </div>

            {/* Customize Plan WhatsApp */}
            <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "0.5px solid rgba(201,151,58,0.12)" }}>
              <label style={labelStyle}>Customize Plan — WhatsApp</label>
              <input style={inputStyle} value={form.customize_plan_whatsapp}
                onChange={e => setForm(f => ({ ...f, customize_plan_whatsapp: e.target.value }))}
                placeholder={lastLand?.customize_plan_whatsapp ?? ""} />
              <p style={{ fontSize: "11px", color: "#6B6762", margin: "6px 0 0" }}>
                Number that opens when the buyer taps Customize plan in the plan picker.
              </p>
            </div>
          </div>

          {/* Price grid */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Price Grid</label>
            <p style={{ fontSize: "11px", color: "#6B6762", margin: "0 0 12px" }}>
              Exact reservation price for every size × plan combination. This is the price shown to the
              buyer — it is typed in directly, not calculated.
            </p>

            {areaOptions.length === 0 || installmentPlans.length === 0 ? (
              <div style={{
                background: "#3A3A3D", border: "0.5px solid rgba(201,151,58,0.15)",
                borderRadius: "8px", padding: "16px", textAlign: "center",
                color: "#6B6762", fontSize: "12px",
              }}>
                Add at least one area and one plan to set prices.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: `${140 + installmentPlans.length * 120}px` }}>
                  <thead>
                    <tr>
                      <th style={{
                        textAlign: "left", padding: "8px 10px", fontSize: "10px", color: "#6B6762",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        borderBottom: "0.5px solid rgba(201,151,58,0.2)",
                      }}>
                        Size
                      </th>
                      {installmentPlans.map(plan => (
                        <th key={plan.id} style={{
                          textAlign: "left", padding: "8px 10px", fontSize: "10px", color: "#6B6762",
                          textTransform: "uppercase", letterSpacing: "0.08em",
                          borderBottom: "0.5px solid rgba(201,151,58,0.2)",
                        }}>
                          {plan.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {areaOptions.map(area => (
                      <tr key={area.id}>
                        <td style={{
                          padding: "8px 10px", fontSize: "13px", color: "#F0EDE6",
                          borderBottom: "0.5px solid rgba(201,151,58,0.08)",
                        }}>
                          {Number(area.area_sqm).toLocaleString()} m²
                        </td>
                        {installmentPlans.map(plan => (
                          <td key={plan.id} style={{ padding: "6px 8px", borderBottom: "0.5px solid rgba(201,151,58,0.08)" }}>
                            <input
                              type="number"
                              style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }}
                              value={priceGrid[priceKey(area.id, plan.id)] ?? ""}
                              onChange={e => handlePriceChange(area.id, plan.id, e.target.value)}
                              onBlur={() => handlePriceBlur(area.id, plan.id)}
                              placeholder="EGP"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              background: "rgba(200,60,60,0.12)", border: "0.5px solid rgba(200,60,60,0.4)",
              borderRadius: "8px", padding: "10px 14px", color: "#E07070",
              fontSize: "13px", marginBottom: "16px",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSave} disabled={saving || uploadingImages} style={{
              background: saving || uploadingImages ? "rgba(201,151,58,0.4)" : "#C9973A",
              color: "#2C2C2E", border: "none", borderRadius: "10px", padding: "11px 24px",
              fontSize: "13px", fontWeight: "600",
              cursor: saving || uploadingImages ? "not-allowed" : "pointer",
            }}>
              {uploadingImages ? "Uploading images..." : saving ? "Saving..." : editId ? "Save changes" : "Add project"}
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

      {/* Project list */}
      {loading ? (
        <p style={{ color: "#9A9489", fontSize: "14px" }}>Loading...</p>
      ) : lands.length === 0 ? (
        <div style={{
          background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: "12px", padding: "48px", textAlign: "center",
        }}>
          <p style={{ color: "#6B6762", fontSize: "14px", margin: 0 }}>No projects yet. Add your first one above.</p>
        </div>
      ) : (
        <div style={{
          background: "#343437", border: "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: "12px", overflow: "hidden",
        }}>
          {lands.map((land, i) => {
            const s = statusColors[land.status] || statusColors.available;
            return (
              <div key={land.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 20px",
                borderBottom: i < lands.length - 1 ? "0.5px solid rgba(201,151,58,0.1)" : "none",
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: "56px", height: "42px", borderRadius: "8px", flexShrink: 0,
                  background: "#3A3A3D", overflow: "hidden",
                  border: "0.5px solid rgba(201,151,58,0.15)",
                }}>
                  {land.image_url ? (
                    <img src={land.image_url} alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: "#6B6762", fontSize: "16px",
                    }}>🏗</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", color: "#F0EDE6", fontWeight: "500" }}>
                    {land.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B6762", marginTop: "2px" }}>
                    {land.locations?.name || "—"} · {land.developers?.name || "—"}
                    {land.price ? ` · EGP ${Number(land.price).toLocaleString()}` : ""}
                  </div>
                </div>

                {/* Status */}
                <span style={{
                  fontSize: "10px", background: s.bg, color: s.color,
                  border: `0.5px solid ${s.color}55`, borderRadius: "999px",
                  padding: "3px 10px", letterSpacing: "0.08em",
                  textTransform: "uppercase", flexShrink: 0,
                }}>
                  {land.status}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button onClick={() => openEdit(land)} style={{
                    background: "transparent",
                    border: "0.5px solid rgba(201,151,58,0.25)",
                    borderRadius: "8px", padding: "7px 14px",
                    color: "#C9973A", fontSize: "12px", cursor: "pointer",
                  }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(land.id)} disabled={deletingId === land.id} style={{
                    background: "transparent",
                    border: "0.5px solid rgba(200,60,60,0.3)",
                    borderRadius: "8px", padding: "7px 14px",
                    color: "#E07070", fontSize: "12px", cursor: "pointer",
                  }}>
                    {deletingId === land.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}