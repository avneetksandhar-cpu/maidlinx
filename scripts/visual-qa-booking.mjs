/**
 * Visual QA screenshots for MaidLinx booking dark UI.
 * Usage: node scripts/visual-qa-booking.mjs
 * Requires: npm run dev on 127.0.0.1:3001
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";
const OUT = join(process.cwd(), "tmp/visual-qa");
mkdirSync(OUT, { recursive: true });

const seedState = {
  propertyType: "house",
  serviceType: "standard",
  serviceTierId: "standard",
  serviceSlug: "standard",
  bedrooms: 2,
  bathrooms: 2,
  squareFootage: 1500,
  line1: "123 Ocean Dr",
  city: "Fort Lauderdale",
  state: "FL",
  postalCode: "33301",
  country: "US",
  marketId: "SOUTH_FLORIDA",
  inServiceArea: true,
  marketName: "Fort Lauderdale, FL",
  schedulePreset: "date",
  date: "2026-10-21",
  arrivalWindow: "morning",
  extras: [],
  accessNotes: "",
  step: 9,
  recurringFrequency: "one_time",
};

const SCREENS = [
  { id: "01-welcome", path: "/book/welcome", seed: false },
  { id: "02-category", path: "/book/property", seed: false },
  { id: "03-service", path: "/book/service", seed: true },
  { id: "04-address", path: "/book/address", seed: true },
  { id: "05-date", path: "/book/date", seed: true },
  { id: "05b-time", path: "/book/time", seed: true },
  { id: "06-review", path: "/book/review", seed: true },
  { id: "06b-payment", path: "/book/payment", seed: true },
];

async function shot(page, name, viewport) {
  const file = join(OUT, `${name}-${viewport}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", file);
}

async function seed(page, state) {
  await page.goto(`${BASE}/book/welcome`, { waitUntil: "domcontentloaded" });
  await page.evaluate((s) => {
    sessionStorage.setItem("maidlinx_booking_state", JSON.stringify(s));
  }, state);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of ["mobile", "desktop"]) {
    const context = await browser.newContext(
      vp === "mobile"
        ? devices["iPhone 13"]
        : { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
    );
    const page = await context.newPage();

    for (const screen of SCREENS) {
      try {
        if (screen.seed) {
          await seed(page, seedState);
        }
        await page.goto(`${BASE}${screen.path}`, { waitUntil: "networkidle", timeout: 25000 });
        await page.waitForTimeout(800);
        await shot(page, screen.id, vp);
      } catch (err) {
        console.error("FAIL", screen.id, vp, err.message);
      }
    }

    try {
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(600);
      await shot(page, "11-dashboard", vp);
    } catch (err) {
      console.error("FAIL dashboard", err.message);
    }

    await context.close();
  }

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
