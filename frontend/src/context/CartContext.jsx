import { createContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export const CartContext = createContext(null);

const CART_KEY = 'lubricentro_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persistir en localStorage cada vez que cambia el carrito
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        if (newQty === existing.quantity) {
          toast.error('Stock máximo alcanzado.');
          return prev;
        }
        toast.success(`"${product.name}" actualizado en el carrito.`);
        return prev.map((i) =>
          i._id === product._id ? { ...i, quantity: newQty } : i
        );
      }
      toast.success(`"${product.name}" agregado al carrito.`);
      return [...prev, { ...product, quantity: Math.min(quantity, product.stock) }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i._id !== productId));
    toast('Producto eliminado del carrito.', { icon: '🗑️' });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i._id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const totalItems  = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice  = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const isEmpty     = items.length === 0;

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, isEmpty, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}
