import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ProjectCard from "@/app/components/ProjectCard";

export default async function LocationPage({ params }) {
  const { id } = await params;

  const [{ data: location }, { data: lands }, { data: developers }] = await Promise.all([
    supabase.from("locations").select("*").eq("id", id).maybeSingle(),
    supabase.from("lands").select("*").eq("location_id", id),
    supabase.from("developers").select("id, name"),
  ]);

  const locationLands = lands ?? [];

  const devMap = {};
  developers?.forEach((d) => { devMap[d.id] = d.name; });

  if (!location) {
    return (
      <main style={{ padding: 40, fontFamily: "Inter, Arial, sans-serif", background: "#2C2C2E", minHeight: "100vh", color: "#F0EDE6" }}>
        <Link href="/" style={{ color: "#C9973A", textDecoration: "none", fontSize: 13 }}>← All locations</Link>
        <h2 style={{ marginTop: 20, fontFamily: "Georgia, serif", fontWeight: 400 }}>Location not found</h2>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "Inter, Arial, sans-serif", background: "#2C2C2E", minHeight: "100vh", color: "#F0EDE6" }}>

      {/* BACK */}
      <div style={{ padding: "1.5rem 1.5rem 0" }}>
        <Link href="/" style={{ fontSize: 13, color: "#C9973A", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          ← All locations
        </Link>
      </div>

      {/* HERO */}
      <div style={{ padding: "1.25rem 1.5rem", background: "#343437", margin: "1rem 1.5rem 0", borderRadius: 12, border: "0.5px solid rgba(201,151,58,0.18)" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6762", marginBottom: 8 }}>Location</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 400, color: "#F0EDE6", marginBottom: 6 }}>{location.name}</h1>
        <p style={{ fontSize: 13, color: "#9A9489", lineHeight: 1.6 }}>{location.description}</p>
      </div>{/* PROJECTS */}
      <div style={{ padding: "1.5rem" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6762", marginBottom: 14 }}>
          {locationLands.length} projects in this area
        </p>

        {!locationLands.length ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6B6762", background: "#343437", borderRadius: 12, border: "0.5px solid rgba(201,151,58,0.18)" }}>
            No projects listed here yet
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 320px))", gap: 14 }}>
            {locationLands.map((land) => (
              <ProjectCard
                key={land.id}
                land={land}
                developerName={devMap[land.developer_id] ?? "—"}
              />
            ))}
          </div>
        )}
      </div>

    </main>
  );
}