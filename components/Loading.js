"use client";

import { Loader2 } from "lucide-react";

export default function Loading({ fullPage = false }) {
  const containerStyle = fullPage
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }
    : {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        width: "100%",
      };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <Loader2 size={36} className="animate-spin" style={{ color: "var(--primary)" }} />
        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          Loading workspace...
        </span>
      </div>
    </div>
  );
}
