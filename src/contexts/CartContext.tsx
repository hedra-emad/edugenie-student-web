"use client";

import { createContext, useContext, useState } from "react";

export interface CartContextValue {
  cartCount: number | null;
  setCartCount: (n: number | null) => void;
}

// Sentinel default — lets useCartContext detect "used outside provider"
const UNSET = Symbol("CartContext.unset");

export const CartContext = createContext<CartContextValue | typeof UNSET>(UNSET);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState<number | null>(null);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx === UNSET) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return ctx;
}
