import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #09090b 0%, #18181b 60%, #1c1917 100%)",
          padding: 80,
          position: "relative",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -200,
            left: -200,
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(255,107,53,0.5) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -200,
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(14,165,233,0.4) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #fb923c, #ea580c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 32px rgba(249,115,22,0.5)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
            </svg>
          </div>
          <span style={{ fontSize: 36, fontWeight: 700 }}>CityCanvas</span>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
              在山财地图上
            </div>
            <div
              style={{
                fontSize: 88,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2,
                background: "linear-gradient(90deg, #fb923c, #f43f5e)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              绘制你的理想校园
            </div>
            <div style={{ marginTop: 30, fontSize: 28, color: "#a1a1aa", maxWidth: 900 }}>
              AI 驱动的校园 DIY 创意创作平台 · AI 实时评估 · 社区共创
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#71717a",
          }}
        >
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            ✨ 泉客松 2026
          </div>
          <span>·</span>
          <span>citycanvas.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
