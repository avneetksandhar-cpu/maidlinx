export function formatListingDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weekday = weekdays[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${months[month - 1]} ${day}`;
}

export function experienceSlugForEvent(input: {
  category?: string | null;
  eventType?: string | null;
  name?: string | null;
}): "nightclub" | "dinner" | "yacht" {
  const hay = `${input.category ?? ""} ${input.eventType ?? ""} ${input.name ?? ""}`.toLowerCase();
  if (/yacht|boat/.test(hay)) return "yacht";
  if (/dine|dinner|restaurant/.test(hay)) return "dinner";
  return "nightclub";
}
