export type BackoffOptions = {
  maxRetries?: number;
  initialDelayMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(response: Response, fallback: number): number {
  const header = response.headers.get("retry-after");
  if (!header) return fallback;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const when = Date.parse(header);
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return fallback;
}

export async function fetchWithBackoff(
  url: string,
  init: RequestInit | undefined,
  options: BackoffOptions = {},
): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const maxRetries = options.maxRetries ?? 4;
  let delay = options.initialDelayMs ?? 500;
  let last: Response | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    last = await fetchImpl(url, init);
    const retryable = last.status === 429 || last.status >= 500;
    if (!retryable || attempt === maxRetries) return last;
    await sleep(retryDelayMs(last, delay));
    delay *= 2;
  }

  return last as Response;
}

export function isRateLimited(response: Response): boolean {
  return response.status === 429;
}
