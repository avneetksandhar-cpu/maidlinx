import type { CartItemInput } from "@/lib/catalog/types";

export function cartQuantity(item: CartItemInput): number {
  return Math.max(1, item.quantity ?? 1);
}

export function expandCartItems(items: CartItemInput[]): CartItemInput[] {
  const expanded: CartItemInput[] = [];
  for (const item of items) {
    const quantity = cartQuantity(item);
    for (let index = 0; index < quantity; index += 1) {
      expanded.push({
        ...item,
        id: quantity === 1 ? item.id : `${item.id}-${index}`,
        quantity: 1,
      });
    }
  }
  return expanded;
}
