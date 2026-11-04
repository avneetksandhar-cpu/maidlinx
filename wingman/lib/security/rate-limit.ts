type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(args: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = args.now ?? Date.now();
  const current = buckets.get(args.key);
  if (!current || current.resetAt <= now) {
    buckets.set(args.key, { count: 1, resetAt: now + args.windowMs });
    return { ok: true };
  }
  if (current.count >= args.limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { ok: true };
}

export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}

export function resetRateLimits(): void {
  buckets.clear();
}
