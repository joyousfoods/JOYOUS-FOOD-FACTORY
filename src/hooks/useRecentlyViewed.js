import { useCallback, useEffect, useState } from 'react';
import { productApi } from '../api';

const KEY = 'jff_recently_viewed';
const MAX = 12;

const readIds = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Only product ids are persisted locally — prices and stock are re-fetched,
 * so a stale localStorage entry can never show an out-of-date price.
 */
export function useRecentlyViewed(excludeId) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ids = readIds().filter((id) => id !== excludeId);
    if (!ids.length) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    productApi
      .byIds(ids)
      .then((result) => {
        if (!cancelled) setProducts(result.items || []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [excludeId]);

  return { products, loading };
}

export function trackProductView(productId) {
  if (!productId) return;
  try {
    const ids = readIds().filter((id) => id !== productId);
    ids.unshift(productId);
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
  } catch {
    /* storage unavailable — recently-viewed simply stays empty */
  }
}

const SEARCH_KEY = 'jff_recent_searches';
const MAX_SEARCHES = 6;

export function useRecentSearches() {
  // Lazy initialiser rather than an effect: the value is available on the
  // very first render, so the dropdown never flashes an empty list.
  const [searches, setSearches] = useState(() => {
    try {
      const raw = localStorage.getItem(SEARCH_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const addSearch = useCallback((term) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setSearches((prev) => {
      const next = [clean, ...prev.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        MAX_SEARCHES
      );
      try {
        localStorage.setItem(SEARCH_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setSearches([]);
    try {
      localStorage.removeItem(SEARCH_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { searches, addSearch, clearSearches };
}
