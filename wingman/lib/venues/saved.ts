const KEY = "wm_saved_events";

export function loadSavedEventIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function toggleSavedEvent(id: string): string[] {
  const current = new Set(loadSavedEventIds());
  if (current.has(id)) current.delete(id);
  else current.add(id);
  const next = Array.from(current);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
