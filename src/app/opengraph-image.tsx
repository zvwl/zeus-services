import { ImageResponse } from "next/og";
import { getSettings, setting } from "@/lib/data";

// A real 1200×630 branded social card, rendered on the fly. This replaces the
// old favicon.svg fallback (which Facebook/Twitter/LinkedIn/Discord ignore).
// Used automatically for OpenGraph + Twitter on every page that doesn't set its
// own image. Reads the admin-configured site name/tagline so it stays in sync.
export const alt = "Zeuservices — Game Top-Ups, Boosting & Accounts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const settings = await getSettings();
  const siteName = setting(settings, "site_name", "Zeuservices");
  const tagline = setting(
    settings,
    "tagline",
    "Buy cheap game top-ups, boosting and accounts with instant delivery."
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "84px",
          background:
            "radial-gradient(120% 120% at 50% -20%, #1c1535 0%, #07070e 55%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "88px",
              height: "88px",
              borderRadius: "22px",
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              fontSize: "54px",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            Z
          </div>
          <div style={{ display: "flex", fontSize: "46px", fontWeight: 800 }}>
            {siteName}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: "74px",
            fontWeight: 800,
            lineHeight: 1.08,
            maxWidth: "920px",
            letterSpacing: "-2px",
          }}
        >
          Game Top-Ups, Boosting &amp; Accounts
        </div>

        <div
          style={{
            display: "flex",
            fontSize: "30px",
            color: "#a1a1aa",
            marginTop: "30px",
            maxWidth: "860px",
          }}
        >
          {tagline}
        </div>

        <div style={{ display: "flex", gap: "14px", marginTop: "44px" }}>
          {["Instant delivery", "Secure Stripe checkout", "Multi-currency"].map(
            (t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: "999px",
                  border: "1px solid #2a2342",
                  background: "rgba(139,92,246,0.14)",
                  color: "#c4b5fd",
                  fontSize: "23px",
                }}
              >
                {t}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
