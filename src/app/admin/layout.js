"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";

const navItems = [
  { label: "Dashboard",    href: "/admin",              icon: "⊞" },
  { label: "Locations",    href: "/admin/locations",    icon: "📍" },
  { label: "Projects",     href: "/admin/lands",        icon: "🏗" },
  { label: "Developers",   href: "/admin/developers",   icon: "🏢" },
  { label: "Reservations", href: "/admin/reservations", icon: "📋" },
  { label: "Office",       href: "/admin/office-reservations", icon: "🗓" },
];

export default function AdminLayout({ children }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [loggingOut, setLoggingOut]   = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [hovered,   setHovered]       = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const expanded  = !collapsed || hovered;
  const sidebarW  = expanded ? 220 : 60;

  return (
    <>
      {/* ─────────────────────────────────────────
          DESKTOP LAYOUT  (hidden on mobile)
      ───────────────────────────────────────── */}
      <div style={{
        minHeight: "100vh",
        background: "#2C2C2E",
        display: "flex",
        fontFamily: "Inter, Arial, sans-serif",
      }}
        className="admin-desktop-layout"
      >
        {/* Sidebar */}
        <aside
          onMouseEnter={() => collapsed && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: sidebarW,
            minWidth: sidebarW,
            minHeight: "100vh",
            background: "#222224",
            borderRight: "0.5px solid rgba(201,151,58,0.15)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            transition: "width 0.25s ease, min-width 0.25s ease",
            zIndex: 50,
          }}
        >
          {/* Brand + toggle */}
          <div style={{
            padding: expanded ? "28px 20px 20px" : "20px 0 20px",
            borderBottom: "0.5px solid rgba(201,151,58,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: expanded ? "space-between" : "center",
            flexShrink: 0,
          }}>
            {expanded && (
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "22px", color: "#C9973A", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  Invegate
                </div>
                <div style={{ fontSize: "10px", color: "#6B6762", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "3px", whiteSpace: "nowrap" }}>
                  Admin Panel
                </div>
              </div>
            )}
            <button
              onClick={() => { setCollapsed(c => !c); setHovered(false); }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                background: "none",
                border: "0.5px solid rgba(201,151,58,0.22)",
                borderRadius: "7px",
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#6B6762", flexShrink: 0,
                transition: "all 0.2s ease", padding: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,151,58,0.55)"; e.currentTarget.style.color = "#C9973A"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,151,58,0.22)"; e.currentTarget.style.color = "#6B6762"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s ease" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav style={{ padding: expanded ? "16px 12px" : "16px 8px", flex: 1 }}>
            {navItems.map(item => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }} title={!expanded ? item.label : undefined}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: expanded ? "flex-start" : "center",
                    gap: expanded ? "10px" : "0",
                    padding: expanded ? "10px 12px" : "10px 0",
                    borderRadius: "8px", marginBottom: "2px",
                    background: active ? "rgba(201,151,58,0.12)" : "transparent",
                    border: active ? "0.5px solid rgba(201,151,58,0.3)" : "0.5px solid transparent",
                    color: active ? "#E8C97A" : "#9A9489",
                    fontSize: "13px", fontWeight: active ? "500" : "400",
                    transition: "all 0.2s ease", cursor: "pointer",
                    whiteSpace: "nowrap", overflow: "hidden",
                  }}>
                    <span style={{ fontSize: "15px", flexShrink: 0 }}>{item.icon}</span>
                    {expanded && item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: expanded ? "16px 12px" : "16px 8px", borderTop: "0.5px solid rgba(201,151,58,0.12)", flexShrink: 0 }}>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title={!expanded ? "Sign out" : undefined}
              style={{
                width: "100%", background: "transparent",
                border: "0.5px solid rgba(201,151,58,0.2)", borderRadius: "8px",
                padding: expanded ? "10px 12px" : "10px 0",
                color: "#9A9489", fontSize: "13px", cursor: "pointer",
                textAlign: expanded ? "left" : "center",
                display: "flex", alignItems: "center",
                justifyContent: expanded ? "flex-start" : "center",
                gap: expanded ? "10px" : "0",
                transition: "all 0.2s ease", whiteSpace: "nowrap", overflow: "hidden",
              }}
            >
              <span style={{ flexShrink: 0 }}>⎋</span>
              {expanded && (loggingOut ? "Signing out..." : "Sign out")}
            </button>
          </div>
        </aside>

        {/* Main content — desktop */}
        <main style={{ flex: 1, padding: "36px 40px", overflowY: "auto", minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* ─────────────────────────────────────────
          MOBILE LAYOUT  (hidden on desktop)
      ───────────────────────────────────────── */}
      <div className="admin-mobile-layout" style={{ display: "none", flexDirection: "column", minHeight: "100vh", background: "#2C2C2E", fontFamily: "Inter, Arial, sans-serif" }}>

        {/* Mobile top bar */}
        <div style={{
          background: "#222224",
          borderBottom: "0.5px solid rgba(201,151,58,0.15)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#C9973A", letterSpacing: "0.04em" }}>
            Invegate
          </div>
          <div style={{ fontSize: "10px", color: "#6B6762", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Admin Panel
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              background: "none", border: "0.5px solid rgba(201,151,58,0.2)",
              borderRadius: "7px", padding: "6px 10px",
              color: "#9A9489", fontSize: "11px", cursor: "pointer",
            }}
          >
            {loggingOut ? "..." : "⎋"}
          </button>
        </div>

        {/* Mobile main content */}
        <main style={{ flex: 1, padding: "20px 16px", overflowY: "auto", paddingBottom: "90px" }}>
          {children}
        </main>

        {/* Mobile bottom navigation bar */}
        <nav style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#222224",
          borderTop: "0.5px solid rgba(201,151,58,0.18)",
          display: "flex",
          zIndex: 100,
          paddingBottom: "env(safe-area-inset-bottom)", /* handles iPhone notch */
        }}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 4px",
                  textDecoration: "none",
                  color: active ? "#C9973A" : "#6B6762",
                  borderTop: active ? "2px solid #C9973A" : "2px solid transparent",
                  background: active ? "rgba(201,151,58,0.06)" : "transparent",
                  transition: "all 0.2s ease",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ─────────────────────────────────────────
          RESPONSIVE SWITCH  (pure CSS, no JS)
      ───────────────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .admin-desktop-layout { display: none !important; }
          .admin-mobile-layout  { display: flex !important; }
        }
        @media (min-width: 769px) {
          .admin-desktop-layout { display: flex !important; }
          .admin-mobile-layout  { display: none !important; }
        }
      `}</style>
    </>
  );
}