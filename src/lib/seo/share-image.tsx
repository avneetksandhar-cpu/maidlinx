import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const shareImageSize = {
  width: 1200,
  height: 630,
} as const;

export const shareImageAlt = "MaidLinx — Book cleaning on demand";
export const shareImageContentType = "image/png";

export async function createShareImageResponse() {
  const markBuffer = await readFile(join(process.cwd(), "public/brand/maidlinx-mark.png"));
  const markSrc = `data:image/png;base64,${markBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #fafcfb 0%, #eaf7f1 55%, #d7efe6 100%)",
          padding: "64px 72px",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <img src={markSrc} width={112} height={112} alt="" />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#07151b",
                lineHeight: 1.05,
              }}
            >
              MaidLinx
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "#087f65",
                letterSpacing: "-0.01em",
              }}
            >
              Book Cleaning On Demand
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              fontSize: 34,
              fontWeight: 500,
              color: "#27363b",
              lineHeight: 1.35,
            }}
          >
            Enter your address, pick a service and time, and confirm online.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 24,
              fontWeight: 600,
              color: "#056b56",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#087f65",
              }}
            />
            Toronto / GTA · South Florida
          </div>
        </div>
      </div>
    ),
    {
      ...shareImageSize,
    },
  );
}
