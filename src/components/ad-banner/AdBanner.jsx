"use client";
import { useEffect, useRef } from "react";

const AD_CLIENT = "ca-pub-1175503001380961";
const AD_SLOT = "1154203131"; // responsive horizontal display ad unit
const ADS_ENABLED = true;

export default function AdBanner({ format = "auto", fullWidthResponsive = true, style }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {}
  }, []);

  if (!ADS_ENABLED) return null;

  return (
    <div style={{ width: '100%', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
