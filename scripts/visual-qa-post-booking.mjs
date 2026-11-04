/**
 * Post-booking 4-state fixture screenshots (pay-after mockup).
 * Usage: node scripts/visual-qa-post-booking.mjs
 * Requires local Next on BASE_URL (default http://127.0.0.1:3001)
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";
const OUT = join(process.cwd(), "company/AGENT_REPORTS/pay-after-screenshots");
mkdirSync(OUT, { recursive: true });

const STATES = [
  "requested",
  "confirmed",
  "on_the_way",
  "paid",
  "payment_failed",
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(devices["iPhone 13"]);
  const page = await context.newPage();

  for (const state of STATES) {
    const url = `${BASE}/bookings/ui-fixture?state=${state}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(900);
      const file = join(OUT, `${state}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log("saved", file);
    } catch (err) {
      console.error("FAIL", state, err.message);
    }
  }

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
