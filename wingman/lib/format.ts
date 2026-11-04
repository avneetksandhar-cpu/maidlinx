export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatFromPrice(amount: number) {
  return `From $${amount.toLocaleString("en-US")}`;
}

/** Sample catalog amounts only — not live inventory or a $500 rule. */
export function formatSampleFromPrice(amount: number) {
  return `Sample from $${amount.toLocaleString("en-US")}`;
}
