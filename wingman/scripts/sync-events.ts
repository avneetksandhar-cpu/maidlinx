import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runDailyEventSync } from "../lib/events/sync";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // env may already be injected
  }
}

async function main() {
  loadEnvLocal();
  const result = await runDailyEventSync({ triggeredBy: "cli" });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
