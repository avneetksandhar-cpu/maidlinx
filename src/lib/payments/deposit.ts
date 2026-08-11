/** Deposit percentage charged at booking checkout (balance due later). */
export function getDepositPercent(): number {
  const raw = process.env.DEPOSIT_PERCENT ?? process.env.NEXT_PUBLIC_DEPOSIT_PERCENT;
  const parsed = raw ? Number(raw) : 25;

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    return 25;
  }

  return parsed;
}

export function calculateDepositCents(totalCents: number): number {
  const percent = getDepositPercent();
  const deposit = Math.round(totalCents * (percent / 100));
  // Stripe minimum charge is $0.50 USD
  return Math.min(Math.max(deposit, 50), totalCents);
}
