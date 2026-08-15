import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistApi } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useCart } from './CartContext';

const WishlistContext = createContext(null);

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
};

export function WishlistProvider({ children }) {
  const { isAuthenticated, initialising } = useAuth();
  const { refresh: refreshCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState(new Set());

  const loadIds = useCallback(async () => {
    if (!isAuthenticated) {
      setIds(new Set());
      setItems([]);
      return;
    }
    try {
      const { productIds } = await wishlistApi.ids();
      setIds(new Set(productIds));
    } catch {
      /* the heart icons simply render unfilled */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (initialising) return;
    loadIds();
  }, [initialising, loadIds]);

  /** Full wishlist rows — only fetched when the wishlist page needs them. */
  const loadItems = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await wishlistApi.list();
      setItems(data.items || []);
      setIds(new Set((data.items || []).map((i) => i.product.id)));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  const markPending = (productId, on) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(productId);
      else next.delete(productId);
      return next;
    });

  const toggle = useCallback(
    async (product) => {
      if (!isAuthenticated) {
        // Saving needs an account, so say so instead of silently failing.
        toast.info('Sign in to save items to your wishlist', {
          action: { label: 'Sign in', onClick: () => navigate('/login?next=/wishlist') },
        });
        return false;
      }

      const productId = product.id;
      const isSaved = ids.has(productId);

      markPending(productId, true);
      // Optimistic — the heart must feel instant.
      setIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        const data = isSaved
          ? await wishlistApi.remove(productId)
          : await wishlistApi.add(productId);
        setItems(data.items || []);
        setIds(new Set((data.items || []).map((i) => i.product.id)));
        toast.success(isSaved ? 'Removed from wishlist' : `${product.name} saved to wishlist`);
        return true;
      } catch (err) {
        // Roll the optimistic flip back.
        setIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(productId);
          else next.delete(productId);
          return next;
        });
        toast.error(err.message);
        return false;
      } finally {
        markPending(productId, false);
      }
    },
    [ids, isAuthenticated, navigate, toast]
  );

  const moveToCart = useCallback(
    async (product, quantity = 1) => {
      markPending(product.id, true);
      try {
        const data = await wishlistApi.moveToCart(product.id, { quantity });
        setItems(data.items || []);
        setIds(new Set((data.items || []).map((i) => i.product.id)));
        await refreshCart();
        toast.success(`${product.name} moved to cart`);
        return true;
      } catch (err) {
        toast.error(err.message);
        return false;
      } finally {
        markPending(product.id, false);
      }
    },
    [refreshCart, toast]
  );

  const saveForLater = useCallback(
    async (product) => {
      if (!isAuthenticated) {
        toast.info('Sign in to save items for later', {
          action: { label: 'Sign in', onClick: () => navigate('/login?next=/cart') },
        });
        return false;
      }
      markPending(product.id, true);
      try {
        const data = await wishlistApi.saveForLater(product.id);
        setItems(data.items || []);
        setIds(new Set((data.items || []).map((i) => i.product.id)));
        await refreshCart();
        toast.success(`${product.name} saved for later`);
        return true;
      } catch (err) {
        toast.error(err.message);
        return false;
      } finally {
        markPending(product.id, false);
      }
    },
    [isAuthenticated, navigate, refreshCart, toast]
  );

  const value = useMemo(
    () => ({
      items,
      count: ids.size,
      loading,
      has: (productId) => ids.has(productId),
      isPending: (productId) => pendingIds.has(productId),
      toggle,
      moveToCart,
      saveForLater,
      loadItems,
    }),
    [items, ids, loading, pendingIds, toggle, moveToCart, saveForLater, loadItems]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
