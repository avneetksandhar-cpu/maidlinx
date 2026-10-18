"use client";

import { cartQuantity } from "@/lib/cart/expand";
import type { CartItemInput } from "@/lib/catalog/types";

export { cartQuantity, expandCartItems } from "@/lib/cart/expand";

export const CART_STORAGE_KEY = "wm_cart_v1";

export function loadCart(): CartItemInput[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function saveCart(items: CartItemInput[]): CartItemInput[] {
  if (typeof window === "undefined") return items;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("wm-cart"));
  return items;
}

function sameLine(a: CartItemInput, b: CartItemInput): boolean {
  return (
    a.kind === b.kind &&
    (a.catalogSlug ?? "") === (b.catalogSlug ?? "") &&
    (a.offerId ?? "") === (b.offerId ?? "") &&
    (a.eventId ?? "") === (b.eventId ?? "") &&
    (a.drinkOption ?? "") === (b.drinkOption ?? "")
  );
}

export function addCartItem(item: CartItemInput): CartItemInput[] {
  const incoming = Math.max(1, item.quantity ?? 1);
  const items = loadCart();
  const match = items.find((row) => sameLine(row, item));
  if (match) {
    return saveCart(
      items.map((row) =>
        row.id === match.id ? { ...row, quantity: cartQuantity(row) + incoming } : row,
      ),
    );
  }
  return saveCart([...items, { ...item, quantity: incoming }]);
}

export function setCartQuantity(id: string, quantity: number): CartItemInput[] {
  if (quantity < 1) return removeCartItem(id);
  return saveCart(loadCart().map((item) => (item.id === id ? { ...item, quantity } : item)));
}

export function removeCartItem(id: string): CartItemInput[] {
  return saveCart(loadCart().filter((item) => item.id !== id));
}

export function clearCart(): CartItemInput[] {
  return saveCart([]);
}

export function newCartItemId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isCartItem(value: unknown): value is CartItemInput {
  if (!value || typeof value !== "object") return false;
  const item = value as CartItemInput;
  return (
    typeof item.id === "string" &&
    (item.kind === "vip_table" || item.kind === "wingman_experience") &&
    typeof item.experienceName === "string" &&
    Number.isInteger(item.guestCount)
  );
}
