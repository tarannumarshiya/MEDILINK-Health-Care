"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PharmacyCartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  requires_prescription: boolean;
  qty: number;
};

type AddToCartItem = Omit<PharmacyCartItem, "qty">;

type PharmacyCartContextType = {
  cart: PharmacyCartItem[];
  cartOpen: boolean;
  cartCount: number;
  total: number;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: AddToCartItem) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "medilink_pharmacy_cart";

const PharmacyCartContext = createContext<PharmacyCartContextType | null>(null);

function readSavedCart(): PharmacyCartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is PharmacyCartItem => {
      return (
        typeof item?.id === "string" &&
        typeof item?.name === "string" &&
        typeof item?.price === "number" &&
        typeof item?.category === "string" &&
        typeof item?.requires_prescription === "boolean" &&
        typeof item?.qty === "number"
      );
    });
  } catch {
    return [];
  }
}

export function PharmacyCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<PharmacyCartItem[]>(readSavedCart);
  const [cartOpen, setCartOpen] = useState(false);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    window.localStorage.setItem("pharmacy_cart_count", String(cartCount));
    window.dispatchEvent(new Event("pharmacy-cart-updated"));
  }, [cart, cartCount]);

  function addToCart(item: AddToCartItem) {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        );
      }

      return [...prev, { ...item, qty: 1 }];
    });

    
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <PharmacyCartContext.Provider
      value={{
        cart,
        cartOpen,
        cartCount,
        total,
        setCartOpen,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </PharmacyCartContext.Provider>
  );
}

export function usePharmacyCart() {
  const context = useContext(PharmacyCartContext);

  if (!context) {
    throw new Error("usePharmacyCart must be used inside PharmacyCartProvider");
  }

  return context;
}