export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function randomToken(bytes = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
