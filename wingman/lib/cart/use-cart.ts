"use client";

import { loadCart } from "@/lib/cart/store";
import type { CartItemInput } from "@/lib/catalog/types";
import { useEffect, useState } from "react";

export function useCartCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    function refresh() {
      setCount(loadCart().reduce((sum, item) => sum + Math.max(1, item.quantity ?? 1), 0));
    }
    refresh();
    window.addEventListener("wm-cart", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wm-cart", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return count;
}

export function useCart(): CartItemInput[] {
  const { items } = useHydratedCart();
  return items;
}

export function useHydratedCart(): { items: CartItemInput[]; ready: boolean } {
  const [items, setItems] = useState<CartItemInput[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function refresh() {
      setItems(loadCart());
      setReady(true);
    }
    refresh();
    window.addEventListener("wm-cart", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wm-cart", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return { items: ready ? items : [], ready };
}
