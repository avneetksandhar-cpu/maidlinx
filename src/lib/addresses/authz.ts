/**
 * Pure ownership checks for saved addresses (no DB I/O).
 * API/repository layers must call this before mutate/delete.
 */

export function assertAddressOwnedByUser(
  addressUserId: string | null | undefined,
  requesterUserId: string | null | undefined,
): void {
  if (!requesterUserId) {
    throw new Error("Authentication required.");
  }
  if (!addressUserId || addressUserId !== requesterUserId) {
    throw new Error("You do not have access to this address.");
  }
}

export function canAccessAddress(
  addressUserId: string | null | undefined,
  requesterUserId: string | null | undefined,
): boolean {
  try {
    assertAddressOwnedByUser(addressUserId, requesterUserId);
    return true;
  } catch {
    return false;
  }
}

export function filterAddressesForUser<T extends { userId: string | null }>(
  addresses: T[],
  requesterUserId: string,
): T[] {
  return addresses.filter((address) => address.userId === requesterUserId);
}
