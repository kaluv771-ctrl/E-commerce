import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "olive-oak-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items]);

  const add = (product, quantity = 1) => {
    setItems(current => {
      const found = current.find(item => item.id === product.id);
      if (found) return current.map(item => item.id === product.id
        ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_quantity ?? 99) } : item);
      return [...current, { ...product, quantity: Math.min(quantity, product.stock_quantity ?? 99) }];
    });
  };
  const update = (id, quantity) => setItems(current => current
    .map(item => item.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock_quantity ?? 99)) } : item));
  const remove = id => setItems(current => current.filter(item => item.id !== id));
  const clear = () => setItems([]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const value = useMemo(() => ({ items, add, update, remove, clear, count, total }), [items, count, total]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
