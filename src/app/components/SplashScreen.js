"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen({ children }) {
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setPhase("visible");
    }, 100);

    const fadeTimer = setTimeout(() => {
      setPhase("fadeout");
    }, 2200);

    const removeTimer = setTimeout(() => {
      setPhase("done");
    }, 3400);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {children}

      {phase !== "done" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#2C2C2E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            zIndex: 9999,
            pointerEvents: "none",

            opacity: phase === "fadeout" ? 0 : 1,
            transition: "opacity 1.2s ease",
          }}
        >
          {/* Gold glow */}
          <div
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(201,151,58,0.10) 0%, transparent 70%)",

              opacity: phase === "fadeout" ? 0 : 1,

              transform:
                phase === "fadeout"
                  ? "scale(1.25)"
                  : "scale(1)",

              transition:
                "opacity 1.2s ease, transform 1.2s ease",
            }}
          />

          {/* Logo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",

              opacity:
                phase === "hidden"
                  ? 0
                  : phase === "fadeout"
                  ? 0
                  : 1,

              transform:
                phase === "hidden"
                  ? "translateY(12px) scale(0.96)"
                  : phase === "fadeout"
                  ? "translateY(-8px) scale(1.03)"
                  : "translateY(0) scale(1)",

              transition:
                "opacity 1s ease, transform 1s ease",
            }}
          >
            <Image
              src="/logo.png"
              alt="Invegate"
              width={240}
              height={120}
              priority
              style={{
                width: "240px",
                height: "auto",
                filter:
                  "drop-shadow(0 0 28px rgba(201,151,58,0.18))",
              }}
            />

            <div
              style={{
                marginTop: 14,
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6B6762",
              }}
            >
              Luxury Real Estate Redefined
            </div>
          </div>
        </div>
      )}
    </>
  );
}