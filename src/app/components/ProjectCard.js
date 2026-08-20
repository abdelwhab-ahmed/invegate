"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const statusStyles = {
  available: {
    bg: "rgba(30,120,70,0.18)",
    border: "rgba(77,201,138,0.35)",
    text: "#4DC98A",
  },
  reserved: {
    bg: "rgba(200,150,40,0.12)",
    border: "rgba(200,150,40,0.3)",
    text: "#E8C97A",
  },
  sold: {
    bg: "rgba(200,60,60,0.12)",
    border: "rgba(200,60,60,0.3)",
    text: "#E07070",
  },
};

export default function ProjectCard({ land, developerName }) {
  const [hovered, setHovered] = useState(false);

  const status = land.status ?? "available";
  const s = statusStyles[status] ?? statusStyles.available;
  const firstImage = land.image_url ?? null;

  const pricePerMeter =
    land.price && land.area_sqm
      ? Math.round(land.price / land.area_sqm)
      : null;

  return (
    <Link
      href={`/land/${land.id}`}
      style={{ textDecoration: "none" }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#343437",
          border: hovered
            ? "0.5px solid rgba(201,151,58,0.55)"
            : "0.5px solid rgba(201,151,58,0.18)",
          borderRadius: 14,
          overflow: "hidden",
          transition:
            "border-color 0.25s ease, transform 0.25s ease",
          transform: hovered
            ? "translateY(-2px)"
            : "translateY(0)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Image */}
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            background: "#3A3A3D",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {firstImage ? (
            <Image
              src={firstImage}
              alt={land.title}
              fill
              sizes="(max-width: 600px) 100vw, 320px"
              style={{ objectFit: "cover" }}
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
                width="42"
                height="42"
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
                "linear-gradient(to top, rgba(0,0,0,0.35), transparent 45%)",
            }}
          />

          {/* Status Badge */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: s.bg,
              border: `0.5px solid ${s.border}`,
              color: s.text,
              fontSize: 9,
              padding: "4px 10px",
              borderRadius: 20,
              textTransform: "capitalize",
              letterSpacing: "0.08em",
              fontWeight: 500,
              backdropFilter: "blur(6px)",
            }}
          >
            {status}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "16px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 17,
              color: "#F0EDE6",
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            {land.title}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#6B6762",
              marginBottom: 18,
            }}
          >
            {developerName}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#E8C97A",
              }}
            >
              {pricePerMeter
                ? `EGP ${pricePerMeter.toLocaleString()}/m²`
                : "On request"}
            </div>

            <div
              style={{
                fontSize: 12,
                color: hovered ? "#C9973A" : "#6B6762",
                transition: "color 0.2s ease",
              }}
            >
              Details →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}