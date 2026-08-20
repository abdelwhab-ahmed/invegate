"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LocationCard({ loc, count }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/location/${loc.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#343437",
          borderRadius: 12,
          overflow: "hidden",
          border: hovered
            ? "0.5px solid rgba(201,151,58,0.55)"
            : "0.5px solid rgba(201,151,58,0.18)",
          transform: hovered ? "translateY(-5px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 18px 40px rgba(0,0,0,0.28)"
            : "0 0 0 rgba(0,0,0,0)",
          transition: "all 0.35s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            background: "#3A3A3D",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {loc.image_url ? (
            <Image
              src={loc.image_url}
              alt={loc.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{
                objectFit: "cover",
                transform: hovered ? "scale(1.04)" : "scale(1)",
                transition: "transform 0.6s ease",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(201,151,58,0.2)"
                strokeWidth="1.5"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(44,44,46,0.78) 0%, transparent 60%)",
            }}
          />
        </div>

        <div style={{ padding: "14px 16px" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 22,
              fontWeight: 500,
              color: "#F0EDE6",
              marginBottom: 6,
            }}
          >
            {loc.name}
          </h2>

          <p
            style={{
              color: "#9A9489",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 14,
              minHeight: 40,
            }}
          >
            {loc.description}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#6B6762",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {count ?? 0} Projects
            </span>

            <div
              style={{
                width: 28,
                height: 28,
                border: hovered
                  ? "0.5px solid rgba(201,151,58,0.55)"
                  : "0.5px solid rgba(201,151,58,0.3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C9973A",
                fontSize: 13,
                background: hovered
                  ? "rgba(201,151,58,0.1)"
                  : "transparent",
                transform: hovered
                  ? "translateX(2px)"
                  : "translateX(0)",
                transition: "all 0.35s ease",
              }}
            >
              →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}