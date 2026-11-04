export function bookNightHref(options?: {
  eventId?: string | null;
  name?: string | null;
  source?: string | null;
  repeat?: string | null;
  go?: boolean;
}) {
  const query = new URLSearchParams();
  if (options?.eventId) query.set("eventId", options.eventId);
  if (options?.name) query.set("name", options.name);
  if (options?.source) query.set("source", options.source);
  if (options?.repeat) query.set("repeat", options.repeat);
  if (options?.go) query.set("go", "1");
  const search = query.toString();
  return search ? `/book?${search}` : "/book";
}
