"use client";
import { useState } from "react";

export default function OGTest() {
  const [id, setId] = useState("");
  const [src, setSrc] = useState(null);

  const preview = () => {
    if (!id.trim()) return;
    setSrc(`/levels/${id.trim()}/opengraph-image`);
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "120px auto 0" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>OG Image Tester</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && preview()}
          placeholder="Chart ID (e.g. 123)"
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14 }}
        />
        <button onClick={preview} style={{ padding: "8px 20px", borderRadius: 8, background: "#38bdf8", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}>
          Preview
        </button>
      </div>
      {src && (
        <div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8 }}>{src}</p>
          <img src={src} alt="OG Preview" style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>
      )}
    </div>
  );
}
