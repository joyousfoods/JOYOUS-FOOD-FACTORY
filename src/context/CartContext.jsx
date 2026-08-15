import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

const STORAGE_KEY = 'jff_cart';

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
};

const save = (items) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => { save(items); }, [items]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { id: product.id, product, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === productId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const getQuantity = useCallback(
    (productId) => items.find((i) => i.id === productId)?.quantity || 0,
    [items]
  );

  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.product.price * i.quantity, 0),
    [items]
  );

  const delivery = subtotal >= 999 || items.some((i) => i.product.freeShipping) ? 0 : 90;
  const total = subtotal + delivery;

  const isPending = useCallback(() => false, []);
  const refresh = useCallback(async () => {}, []);

  const value = useMemo(() => ({
    items,
    itemCount,
    subtotal,
    delivery,
    total,
    addItem,
    removeItem,
    setQuantity,
    clear,
    getQuantity,
    isPending,
    refresh,
  }), [items, itemCount, subtotal, delivery, total, addItem, removeItem, setQuantity, clear, getQuantity, isPending, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

