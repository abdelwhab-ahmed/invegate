"use client";

import { useState, useRef, useEffect } from "react";

export default function PhotoGallery({ images, alt, status, statusStyle, hideStatusBadge = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverZone, setHoverZone] = useState(null); // "left" | "right" | null — drives arrow visibility

  // ---- Edge-hover auto-scroll (desktop only) ----
  // Tracked via continuous mousemove rather than enter/leave on thin overlay
  // strips, which is more reliable and re-evaluates on every frame the mouse moves.
  const intervalRef = useRef(null);
  const directionRef = useRef(null);

  function clearAutoScroll() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    directionRef.current = null;
  }

  function startAutoScroll(direction, count) {
    if (directionRef.current === direction) return; // already running this way
    clearAutoScroll();
    directionRef.current = direction;
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = direction === "left" ? prev - 1 : prev + 1;
        if (next < 0 || next > count - 1) {
          clearAutoScroll();
          return prev;
        }
        return next;
      });
    }, 700);
  }

  function handleMainMouseMove(e) {
    if (images.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const relX = (e.clientX - rect.left) / rect.width;

    if (relX < 0.28 && activeIndex > 0) {
      setHoverZone("left");
      startAutoScroll("left", images.length);
    } else if (relX > 0.72 && activeIndex < images.length - 1) {
      setHoverZone("right");
      startAutoScroll("right", images.length);
    } else {
      setHoverZone(null);
      clearAutoScroll();
    }
  }

  function handleMainMouseLeave() {
    setHoverZone(null);
    clearAutoScroll();
  }

  useEffect(() => () => clearAutoScroll(), []);

  if (!images || images.length === 0) {
    return (
      <div style={{ width: "92%", margin: "1rem auto 0", boxSizing: "border-box" }}>
        <div style={{ borderRadius: 14, position: "relative" }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 10",
              background: "#3A3A3D",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(201,151,58,0.2)" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          {!hideStatusBadge && status && statusStyle && (
            <div
              style={{
                position: "absolute", top: 14, right: 14, background: statusStyle.bg,
                border: `0.5px solid ${statusStyle.border}`, color: statusStyle.text,
                fontSize: 10, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
                textTransform: "capitalize", letterSpacing: "0.08em",
              }}
            >
              {status}
            </div>
          )}
        </div>
      </div>
    );
  }

  const prevImage = activeIndex > 0 ? images[activeIndex - 1] : null;
  const nextImage = activeIndex < images.length - 1 ? images[activeIndex + 1] : null;

  return (
    <div style={{ width: "92%", margin: "1rem auto 0", boxSizing: "border-box" }}>

      {/* MOBILE — unchanged horizontal scroll-snap carousel */}
      <div
        className="pg-mobile"
        style={{ borderRadius: 14, position: "relative" }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            overflowX: "scroll",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            borderRadius: 14,
            background: "#3A3A3D",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {images.map((img, i) => (
            <div
              key={img.id ?? i}
              style={{
                flex: "0 0 100%",
                maxWidth: "100%",
                width: "100%",
                aspectRatio: "16 / 10",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                overflow: "hidden",
              }}
            >
              <img
                src={img.image_url}
                alt={alt}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
        </div>

        {!hideStatusBadge && status && statusStyle && (
          <div
            style={{
              position: "absolute", top: 14, right: 14, background: statusStyle.bg,
              border: `0.5px solid ${statusStyle.border}`, color: statusStyle.text,
              fontSize: 10, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
              textTransform: "capitalize", letterSpacing: "0.08em",
            }}
          >
            {status}
          </div>
        )}

        {images.length > 1 && (
          <div
            style={{
              position: "absolute", bottom: 14, right: 14, background: "rgba(0,0,0,0.55)",
              color: "#F0EDE6", fontSize: 11, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.04em",
            }}
          >
            {images.length} photos · swipe →
          </div>
        )}
      </div>

      {/* DESKTOP — main image + grayscale side peeks + thumbnail rail, centered */}
      <div
        className="pg-desktop"
        style={{ display: "none", gap: 10, alignItems: "stretch", justifyContent: "center" }}
      >
        {/* Left grayscale peek */}
        <div
          style={{
            flex: "0 0 130px",
            borderRadius: 12,
            overflow: "hidden",
            background: "#3A3A3D",
            position: "relative",
          }}
        >
          {prevImage && (
            <img
              src={prevImage.image_url}
              alt=""
              onClick={() => setActiveIndex(activeIndex - 1)}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                filter: "grayscale(1) brightness(0.65)",
                cursor: "pointer", display: "block",
              }}
            />
          )}
        </div>

        {/* Main image — sliding strip with smooth transition, fills remaining width */}
        <div
          onMouseMove={handleMainMouseMove}
          onMouseLeave={handleMainMouseLeave}
          style={{
            flex: "1 1 auto",
            borderRadius: 14,
            overflow: "hidden",
            position: "relative",
            background: "#3A3A3D",
            cursor: hoverZone === "left" ? "w-resize" : hoverZone === "right" ? "e-resize" : "default",
          }}
        >
          <div
            style={{
              display: "flex",
              width: `${images.length * 100}%`,
              transform: `translateX(-${(activeIndex * 100) / images.length}%)`,
              transition: "transform 0.55s cubic-bezier(0.65, 0, 0.35, 1)",
            }}
          >
            {images.map((img, i) => (
              <div
                key={img.id ?? i}
                style={{ width: `${100 / images.length}%`, flexShrink: 0, aspectRatio: "16 / 10" }}
              >
                <img
                  src={img.image_url}
                  alt={alt}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>

          {/* Left edge affordance — gradient scrim + chevron, purely decorative */}
          {images.length > 1 && activeIndex > 0 && (
            <div
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "32%",
                background: "linear-gradient(to right, rgba(0,0,0,0.32), transparent)",
                display: "flex", alignItems: "center", justifyContent: "flex-start",
                paddingLeft: 16, pointerEvents: "none",
                opacity: hoverZone === "left" ? 1 : 0,
                transition: "opacity 0.25s ease",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
          )}

          {/* Right edge affordance */}
          {images.length > 1 && activeIndex < images.length - 1 && (
            <div
              style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: "32%",
                background: "linear-gradient(to left, rgba(0,0,0,0.32), transparent)",
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                paddingRight: 16, pointerEvents: "none",
                opacity: hoverZone === "right" ? 1 : 0,
                transition: "opacity 0.25s ease",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          )}

          {!hideStatusBadge && status && statusStyle && (
            <div
              style={{
                position: "absolute", top: 14, right: 14, background: statusStyle.bg,
                border: `0.5px solid ${statusStyle.border}`, color: statusStyle.text,
                fontSize: 10, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
                textTransform: "capitalize", letterSpacing: "0.08em",
                pointerEvents: "none", zIndex: 3,
              }}
            >
              {status}
            </div>
          )}

          {images.length > 1 && (
            <div
              style={{
                position: "absolute", bottom: 14, right: 14, background: "rgba(0,0,0,0.55)",
                color: "#F0EDE6", fontSize: 11, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.04em",
                pointerEvents: "none", zIndex: 3,
              }}
            >
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Right grayscale peek */}
        <div
          style={{
            flex: "0 0 130px",
            borderRadius: 12,
            overflow: "hidden",
            background: "#3A3A3D",
            position: "relative",
          }}
        >
          {nextImage && (
            <img
              src={nextImage.image_url}
              alt=""
              onClick={() => setActiveIndex(activeIndex + 1)}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                filter: "grayscale(1) brightness(0.65)",
                cursor: "pointer", display: "block",
              }}
            />
          )}
        </div>

        {/* Thumbnail rail */}
        {images.length > 1 && (
          <div
            style={{
              flex: "0 0 72px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 360,
              overflowY: "auto",
            }}
          >
            {images.map((img, i) => (
              <button
                key={img.id ?? i}
                onClick={() => setActiveIndex(i)}
                style={{
                  border: i === activeIndex ? "2px solid #C9973A" : "0.5px solid rgba(201,151,58,0.18)",
                  borderRadius: 8,
                  padding: 0,
                  cursor: "pointer",
                  background: "none",
                  width: "100%",
                  aspectRatio: "4 / 3",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  src={img.image_url}
                  alt=""
                  style={{
                    width: "100%", height: "100%", objectFit: "cover", display: "block",
                    filter: i === activeIndex ? "none" : "grayscale(1) brightness(0.75)",
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 860px) {
          .pg-mobile { display: none; }
          .pg-desktop { display: flex !important; }
        }
      `}</style>
    </div>
  );
}