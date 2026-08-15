import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useRecentSearches } from '../../hooks/useRecentlyViewed';
import { productApi } from '../../api';
import { formatPrice } from '../../utils/format';

const TRENDING = ['Gift box', 'Rose', 'Kesar Badam', 'Honey dry fruit', 'Bulk packs'];

/**
 * Header search with debounced suggestions.
 *
 * Requests are debounced at 250ms and aborted when superseded, so typing
 * quickly issues one request rather than one per keystroke, and a slow
 * earlier response can never overwrite a newer one.
 */
export function SearchBar({ autoFocus = false, onNavigate, variant = 'header' }) {
  const navigate = useNavigate();
  const { searches, addSearch, clearSearches } = useRecentSearches();

  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedTerm = useDebounce(term, 250);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const query = debouncedTerm.trim();

    if (query.length < 2) {
      setResults({ products: [], categories: [] });
      setLoading(false);
      return undefined;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    productApi
      .suggestions(query, { signal: controller.signal })
      .then((data) => setResults(data))
      .catch((err) => {
        if (err.name !== 'AbortError') setResults({ products: [], categories: [] });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedTerm]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const go = (path, searchTerm) => {
    if (searchTerm) addSearch(searchTerm);
    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
    navigate(path);
  };

  const submit = (event) => {
    event?.preventDefault();
    const query = term.trim();
    if (!query) return;
    go(`/shop?q=${encodeURIComponent(query)}`, query);
  };

  const flatResults = [
    ...results.categories.map((c) => ({ type: 'category', ...c })),
    ...results.products.map((p) => ({ type: 'product', ...p })),
  ];

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!flatResults.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % flatResults.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatResults.length - 1 : i - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const item = flatResults[activeIndex];
      go(item.type === 'product' ? `/product/${item.slug}` : `/shop?category=${item.slug}`, term);
    }
  };

  const showEmptyPanel = term.trim().length < 2;
  const hasResults = flatResults.length > 0;

  return (
    <div className={`search search--${variant}`} ref={containerRef}>
      <form className="search__form" onSubmit={submit} role="search">
        <Search size={17} className="search__icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className="search__input"
          placeholder="Search chocolates, gift boxes, flavours…"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Search products"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {loading && <Loader2 size={15} className="search__spinner" aria-hidden="true" />}
        {term && !loading && (
          <button
            type="button"
            className="search__clear"
            onClick={() => {
              setTerm('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </form>

      {open && (
        <div className="search__panel" role="listbox">
          {showEmptyPanel ? (
            <>
              {searches.length > 0 && (
                <div className="search__group">
                  <div className="search__group-head">
                    <span>
                      <Clock size={12} /> Recent searches
                    </span>
                    <button type="button" onClick={clearSearches}>
                      Clear
                    </button>
                  </div>
                  {searches.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className="search__row"
                      onClick={() => {
                        setTerm(entry);
                        go(`/shop?q=${encodeURIComponent(entry)}`, entry);
                      }}
                    >
                      <Clock size={14} className="search__row-icon" />
                      <span>{entry}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="search__group">
                <div className="search__group-head">
                  <span>
                    <TrendingUp size={12} /> Popular right now
                  </span>
                </div>
                <div className="search__trending">
                  {TRENDING.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className="chip"
                      onClick={() => {
                        setTerm(entry);
                        go(`/shop?q=${encodeURIComponent(entry)}`, entry);
                      }}
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : hasResults ? (
            <>
              {results.categories.length > 0 && (
                <div className="search__group">
                  <div className="search__group-head">
                    <span>Categories</span>
                  </div>
                  {results.categories.map((category, index) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`search__row ${activeIndex === index ? 'is-active' : ''}`}
                      onClick={() => go(`/shop?category=${category.slug}`, term)}
                      role="option"
                      aria-selected={activeIndex === index}
                    >
                      <Search size={14} className="search__row-icon" />
                      <span>
                        Browse <strong>{category.name}</strong>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.products.length > 0 && (
                <div className="search__group">
                  <div className="search__group-head">
                    <span>Products</span>
                  </div>
                  {results.products.map((product, index) => {
                    const flatIndex = results.categories.length + index;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={`search__product ${activeIndex === flatIndex ? 'is-active' : ''}`}
                        onClick={() => go(`/product/${product.slug}`, term)}
                        role="option"
                        aria-selected={activeIndex === flatIndex}
                      >
                        <img src={product.imageUrl} alt="" loading="lazy" />
                        <span className="search__product-info">
                          <span className="search__product-name">{product.name}</span>
                          <span className="search__product-meta">
                            {product.packLabel || product.category?.name}
                          </span>
                        </span>
                        <span className="search__product-price">
                          {formatPrice(product.pricePaise)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <button type="button" className="search__all" onClick={submit}>
                See all results for &ldquo;{term.trim()}&rdquo;
              </button>
            </>
          ) : (
            !loading && (
              <div className="search__empty">
                <p>
                  No matches for <strong>{term.trim()}</strong>
                </p>
                <span>Try a flavour name, &ldquo;gift box&rdquo;, or browse the full shop.</span>
                <button type="button" className="chip" onClick={() => go('/shop')}>
                  Browse all products
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
