"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#2C2C2E",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, Arial, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#343437",
        border: "0.5px solid rgba(201,151,58,0.25)",
        borderRadius: "16px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "400px",
      }}>
        {/* Logo area */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: "28px",
            color: "#C9973A",
            letterSpacing: "0.04em",
            marginBottom: "6px",
          }}>
            Invegate
          </div>
          <div style={{
            fontSize: "11px",
            color: "#6B6762",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Admin Panel
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{
            display: "block",
            fontSize: "11px",
            color: "#9A9489",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="admin@invegate.com"
            style={{
              width: "100%",
              background: "#3A3A3D",
              border: "0.5px solid rgba(201,151,58,0.25)",
              borderRadius: "10px",
              padding: "12px 14px",
              color: "#F0EDE6",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{
            display: "block",
            fontSize: "11px",
            color: "#9A9489",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            style={{
              width: "100%",
              background: "#3A3A3D",
              border: "0.5px solid rgba(201,151,58,0.25)",
              borderRadius: "10px",
              padding: "12px 14px",
              color: "#F0EDE6",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(200,60,60,0.12)",
            border: "0.5px solid rgba(200,60,60,0.4)",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "#E07070",
            fontSize: "13px",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          style={{
            width: "100%",
            background: loading || !email || !password ? "rgba(201,151,58,0.3)" : "#C9973A",
            color: loading || !email || !password ? "rgba(240,237,230,0.4)" : "#2C2C2E",
            border: "none",
            borderRadius: "10px",
            padding: "13px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: loading || !email || !password ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            transition: "all 0.25s ease",
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}