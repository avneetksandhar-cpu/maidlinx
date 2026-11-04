export type SyncLogLevel = "info" | "warn" | "error";

export type SyncLogEntry = {
  scope: "event-sync";
  level: SyncLogLevel;
  message: string;
  ts: string;
  source?: string;
  extra?: Record<string, unknown>;
};

export function makeSyncLog(
  level: SyncLogLevel,
  message: string,
  extra?: Record<string, unknown>,
): SyncLogEntry {
  return {
    scope: "event-sync",
    level,
    message,
    ts: new Date().toISOString(),
    source: extra?.source ? String(extra.source) : undefined,
    extra,
  };
}

export function writeSyncLog(entry: SyncLogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.log(line);
}
