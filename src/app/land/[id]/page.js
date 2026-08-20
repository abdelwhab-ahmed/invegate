import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ProjectDetails from "@/app/components/ProjectDetails";
import PhotoGallery from "@/app/components/PhotoGallery";

const STATUS_STYLES = {
  available: { bg: "rgba(30,120,70,0.18)", border: "rgba(77,201,138,0.35)", text: "#4DC98A" },
  reserved:  { bg: "rgba(200,150,40,0.12)", border: "rgba(200,150,40,0.3)",  text: "#E8C97A" },
  sold:      { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.3)",   text: "#E07070" },
};

export default async function LandPage({ params }) {
  const { id } = await params;

  const { data: land } = await supabase
    .from("lands")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!land) {
    return (
      <main style={{ padding: 40, fontFamily: "Inter, Arial, sans-serif", background: "#2C2C2E", minHeight: "100vh", color: "#F0EDE6" }}>
        <Link href="/" style={{ color: "#C9973A", textDecoration: "none", fontSize: 13 }}>← Back</Link>
        <h2 style={{ marginTop: 20, fontFamily: "Georgia, serif", fontWeight: 400 }}>Project not found</h2>
      </main>
    );
  }

  const [{ data: developer }, { data: images }, { data: location }, { data: landAreas }, { data: installmentPlans }, { data: officeSchedule }] =
    await Promise.all([
      land.developer_id
        ? supabase.from("developers").select("*").eq("id", land.developer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("land_images").select("*").eq("land_id", id),
      land.location_id
        ? supabase.from("locations").select("*").eq("id", land.location_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("land_areas").select("*").eq("land_id", id).order("area_sqm"),
      supabase.from("land_installment_plans").select("*").eq("land_id", id).order("created_at"),
      supabase.from("office_schedule").select("*").order("day_of_week"),
    ]);

  const areaList = landAreas ?? [];
  const planList = installmentPlans ?? [];
  const areaIds = areaList.map((a) => a.id);

  const { data: priceRows } =
    areaIds.length > 0
      ? await supabase.from("land_area_plan_prices").select("*").in("land_area_id", areaIds)
      : { data: [] };

  // Split the project's images by is_masterplan: regular gallery vs. masterplan
  // gallery (shown inside the unit picker card). A row missing the column
  // (older data) falls back to the regular gallery via the !img.is_masterplan check.
  const allImages = images ?? [];
  const imageList = allImages.filter((img) => !img.is_masterplan);
  const masterplanImages = allImages.filter((img) => img.is_masterplan);

  const status = land.status ?? "available";
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.available;

  const whatsappNumber = land.contact_whatsapp ?? "201000000000";
  const whatsappMessage = encodeURIComponent(
    `I am interested in ${land.title} in ${location?.name ?? "your area"}, price EGP ${Number(land.price).toLocaleString()}`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const mapsUrl = land.location_url || null;

  return (
    <main style={{ fontFamily: "Inter, Arial, sans-serif", background: "#2C2C2E", minHeight: "100vh", color: "#F0EDE6", paddingBottom: "4rem" }}>

      {/* BACK */}
      <div style={{ padding: "1.5rem 1.5rem 0" }}>
        <Link
          href={location ? `/location/${land.location_id}` : "/"}
          style={{ fontSize: 13, color: "#C9973A", textDecoration: "none" }}
        >
          ← {location ? location.name : "All locations"}
        </Link>
      </div>

      {/* PHOTO GALLERY — mobile: scroll carousel · desktop: main + grayscale peeks + thumbnail rail */}
      <PhotoGallery images={imageList} alt={land.title} status={status} statusStyle={s} />

      {/* KEY INFO, AREA/PLAN PICKERS, LOCATION, DEVELOPER, CONTACT */}
      <ProjectDetails
        land={land}
        developer={developer}
        location={location}
        mapsUrl={mapsUrl}
        whatsappUrl={whatsappUrl}
        landAreas={areaList}
        installmentPlans={planList}
        priceRows={priceRows ?? []}
        masterplanImages={masterplanImages}
        customize_plan_whatsapp={land.customize_plan_whatsapp ?? null}
        developer_whatsapp={land.developer_whatsapp ?? developer?.whatsapp ?? null}
        down_payment_amount={land.down_payment_amount ?? null}
        amman_whatsapp={land.amman_whatsapp ?? null}
        developer_bank_account={developer?.bank_account ?? null}
        office_schedule={officeSchedule ?? []}
      />

    </main>
  );
}