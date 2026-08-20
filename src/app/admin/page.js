import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: locationsCount },
    { count: landsCount },
    { count: developersCount },
    { count: reservationsCount },
    { data: pendingReservations },
    { data: recentLands },
  ] = await Promise.all([
    supabase.from("locations").select("*", { count: "exact", head: true }),
    supabase.from("lands").select("*", { count: "exact", head: true }),
    supabase.from("developers").select("*", { count: "exact", head: true }),
    supabase.from("reservations").select("*", { count: "exact", head: true }),
    supabase.from("reservations").select("*").eq("status", "pending").limit(5).order("created_at", { ascending: false }),
    supabase.from("lands").select("id, title, status, created_at").limit(5).order("created_at", { ascending: false }),
  ]);

  const stats = [
    { label: "Locations", value: locationsCount ?? 0, href: "/admin/locations", color: "#C9973A" },
    { label: "Projects", value: landsCount ?? 0, href: "/admin/lands", color: "#C9973A" },
    { label: "Developers", value: developersCount ?? 0, href: "/admin/developers", color: "#C9973A" },
    { label: "Reservations", value: reservationsCount ?? 0, href: "/admin/reservations", color: "#C9973A" },
  ];

  const statusColor = {
    available: { color: "#4DC98A", bg: "rgba(30,120,70,0.18)" },
    reserved: { color: "#E8C97A", bg: "rgba(200,150,40,0.12)" },
    sold: { color: "#E07070", bg: "rgba(200,60,60,0.12)" },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: "28px",
          color: "#F0EDE6",
          margin: 0,
          marginBottom: "6px",
        }}>
          Dashboard
        </h1>
        <p style={{ color: "#9A9489", fontSize: "13px", margin: 0 }}>
          Overview of your Invegate platform
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        marginBottom: "36px",
      }}>
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#343437",
              border: "0.5px solid rgba(201,151,58,0.18)",
              borderRadius: "12px",
              padding: "22px 20px",
              transition: "all 0.25s ease",
            }}>
              <div style={{
                fontSize: "32px",
                fontFamily: "Georgia, serif",
                color: "#E8C97A",
                marginBottom: "4px",
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: "11px",
                color: "#9A9489",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>
                {stat.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Pending reservations */}
        <div style={{
          background: "#343437",
          border: "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}>
            <h2 style={{
              fontSize: "14px",
              color: "#F0EDE6",
              margin: 0,
              fontWeight: "500",
            }}>
              Pending Reservations
            </h2>
            <Link href="/admin/reservations" style={{
              fontSize: "12px",
              color: "#C9973A",
              textDecoration: "none",
            }}>
              View all →
            </Link>
          </div>
          {!pendingReservations?.length ? (
            <p style={{ color: "#6B6762", fontSize: "13px", margin: 0 }}>No pending reservations</p>
          ) : (
            pendingReservations.map(r => (
              <div key={r.id} style={{
                padding: "10px 0",
                borderBottom: "0.5px solid rgba(201,151,58,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#F0EDE6" }}>{r.full_name}</div>
                  <div style={{ fontSize: "11px", color: "#6B6762", marginTop: "2px" }}>{r.phone}</div>
                </div>
                <span style={{
                  fontSize: "10px",
                  background: "rgba(200,150,40,0.12)",
                  color: "#E8C97A",
                  border: "0.5px solid rgba(200,150,40,0.3)",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  letterSpacing: "0.08em",
                }}>
                  PENDING
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent projects */}
        <div style={{
          background: "#343437",
          border: "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
          }}>
            <h2 style={{
              fontSize: "14px",
              color: "#F0EDE6",
              margin: 0,
              fontWeight: "500",
            }}>
              Recent Projects
            </h2>
            <Link href="/admin/lands" style={{
              fontSize: "12px",
              color: "#C9973A",
              textDecoration: "none",
            }}>
              View all →
            </Link>
          </div>
          {!recentLands?.length ? (
            <p style={{ color: "#6B6762", fontSize: "13px", margin: 0 }}>No projects yet</p>
          ) : (
            recentLands.map(land => {
              const s = statusColor[land.status] || statusColor.available;
              return (
                <div key={land.id} style={{
                  padding: "10px 0",
                  borderBottom: "0.5px solid rgba(201,151,58,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{ fontSize: "13px", color: "#F0EDE6" }}>{land.title}</div>
                  <span style={{
                    fontSize: "10px",
                    background: s.bg,
                    color: s.color,
                    border: `0.5px solid ${s.color}55`,
                    borderRadius: "999px",
                    padding: "3px 10px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}>
                    {land.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Office Working Hours — clickable link to dedicated page */}
      <Link href="/admin/office-hours" style={{ textDecoration: "none" }}>
        <div style={{
          background: "#343437",
          border: "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: "12px",
          padding: "20px 24px",
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <h2 style={{ fontSize: "14px", color: "#F0EDE6", margin: 0, fontWeight: "500" }}>
              Office Working Hours
            </h2>
            <p style={{ fontSize: "12px", color: "#6B6762", margin: "4px 0 0" }}>
              Set the days and times buyers can request an office meeting
            </p>
          </div>
          <span style={{ fontSize: "12px", color: "#C9973A" }}>Manage →</span>
        </div>
      </Link>
    </div>
  );
}