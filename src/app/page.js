import { supabase } from "@/lib/supabase";
import Image from "next/image";
import LocationSearch from "./components/LocationSearch";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ data: locations }, { data: lands }, { data: developers }] =
    await Promise.all([
      supabase.from("locations").select("id, name, description, image_url"),
      supabase.from("lands").select("id, location_id, status"),
      supabase.from("developers").select("id"),
    ]);

  const locationList = locations ?? [];
  const landList = lands ?? [];
  const developerList = developers ?? [];
  const countByLocation = {};
  let availableCount = 0;

  landList.forEach((land) => {
    if (land.status === "available") {
      availableCount += 1;
      countByLocation[land.location_id] =
        (countByLocation[land.location_id] || 0) + 1;
    }
  });

  return (
    <main
      style={{
        fontFamily: "var(--font-body)",
        background: "#2C2C2E",
        minHeight: "100vh",
        color: "#F0EDE6",
      }}
    >
      <section
        style={{
          padding: "4rem 2rem 3rem",
          textAlign: "center",
          borderBottom: "0.5px solid rgba(201,151,58,0.18)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, rgba(201,151,58,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ marginBottom: "1.5rem", position: "relative" }}>
          <Image
            src="/logo.png"
            alt="Invegate"
            width={240}
            height={120}
            priority
            style={{
              width: "240px",
              height: "auto",
              margin: "0 auto 10px",
              display: "block",
            }}
          />

          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#6B6762",
            }}
          >
            Luxury Real Estate Redefined · Where Safety Meets Sophistication
          </div>
        </div>

        <div
          style={{
            width: 40,
            height: 1,
            background: "rgba(201,151,58,0.35)",
            margin: "0 auto 1.5rem",
          }}
        />

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 42,
            fontWeight: 400,
            color: "#F0EDE6",
            lineHeight: 1.15,
            marginBottom: 14,
            position: "relative",
          }}
        >
          Find your{" "}
          <em style={{ color: "#C9973A", fontStyle: "italic" }}>
            perfect project
          </em>
          <br />
          across Egypt
        </h1>

        <p
          style={{
            color: "#9A9489",
            maxWidth: 460,
            margin: "0 auto",
            lineHeight: 1.8,
            fontSize: 14,
            position: "relative",
          }}
        >
          Curated land projects across Egypt&apos;s most prestigious
          addresses — verified, trusted, and direct.
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        {[
          { num: locationList.length, label: "Locations" },
          { num: availableCount, label: "Projects" },
          { num: developerList.length, label: "Developers" },
        ].map(({ num, label }, i) => (
          <div
            key={label}
            style={{
              padding: "22px 8px",
              textAlign: "center",
              borderRight:
                i < 2
                  ? "0.5px solid rgba(201,151,58,0.18)"
                  : "none",
              borderBottom: "0.5px solid rgba(201,151,58,0.18)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 40,
                color: "#C9973A",
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {num}
            </div>

            <div
              style={{
                fontSize: 10,
                color: "#6B6762",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <section style={{ padding: "2rem 1.5rem 4rem" }}>
        <LocationSearch
          locations={locationList}
          countByLocation={countByLocation}
        />
      </section>
    </main>
  );
}