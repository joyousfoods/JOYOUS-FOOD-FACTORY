import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, Search, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CATEGORIES, filterProducts } from '../data/products';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'discount',   label: 'Highest Discount' },
];

function ProductCard({ product }) {
  const { addItem, getQuantity, setQuantity, removeItem } = useCart();
  const qty = getQuantity(product.id);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div className="scard">
      <Link to={`/product/${product.slug}`} className="scard__img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <span className="scard__badge">{product.badge}</span>}
        {discount > 0 && <span className="scard__discount">{discount}% off</span>}
      </Link>
      <div className="scard__body">
        <p className="scard__cat">{product.packLabel}</p>
        <h3 className="scard__name">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="scard__desc">{product.shortDescription}</p>
        <div className="scard__foot">
          <div className="scard__price">
            <span className="scard__price-now">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="scard__price-mrp">₹{product.mrp}</span>
            )}
          </div>
          {qty === 0 ? (
            <button className="scard__add" onClick={() => addItem(product)}>
              <ShoppingCart size={15} /> Add
            </button>
          ) : (
            <div className="scard__qty">
              <button onClick={() => qty === 1 ? removeItem(product.id) : setQuantity(product.id, qty - 1)}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQuantity(product.id, qty + 1)}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category  = searchParams.get('category') || 'all';
  const q         = searchParams.get('q') || '';
  const sort      = searchParams.get('sort') || 'default';
  const bestSeller = searchParams.get('bestSeller') === 'true';
  const newArrival = searchParams.get('newArrival') === 'true';

  const set = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'default' || value === 'false') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const products = useMemo(
    () => filterProducts({ category, q, sort, bestSeller, newArrival }),
    [category, q, sort, bestSeller, newArrival]
  );

  const activeCount = [
    category !== 'all', q, sort !== 'default', bestSeller, newArrival,
  ].filter(Boolean).length;

  const clearAll = () => setSearchParams({});

  const filterPanel = (
    <div className="shop-filters">
      <div className="shop-filters__group">
        <h4>Category</h4>
        {CATEGORIES.map((cat) => (
          <label key={cat.id} className={`shop-filters__opt ${category === cat.id ? 'is-active' : ''}`}>
            <input
              type="radio"
              name="category"
              checked={category === cat.id}
              onChange={() => set('category', cat.id)}
            />
            {cat.label}
          </label>
        ))}
      </div>

      <div className="shop-filters__group">
        <h4>Sort by</h4>
        {SORT_OPTIONS.map((opt) => (
          <label key={opt.value} className={`shop-filters__opt ${sort === opt.value ? 'is-active' : ''}`}>
            <input
              type="radio"
              name="sort"
              checked={sort === opt.value}
              onChange={() => set('sort', opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div className="shop-filters__group">
        <h4>Collections</h4>
        <label className={`shop-filters__opt ${bestSeller ? 'is-active' : ''}`}>
          <input type="checkbox" checked={bestSeller} onChange={(e) => set('bestSeller', e.target.checked ? 'true' : '')} />
          <Star size={13} /> Best Sellers
        </label>
        <label className={`shop-filters__opt ${newArrival ? 'is-active' : ''}`}>
          <input type="checkbox" checked={newArrival} onChange={(e) => set('newArrival', e.target.checked ? 'true' : '')} />
          New Arrivals
        </label>
      </div>

      {activeCount > 0 && (
        <button className="shop-filters__clear" onClick={clearAll}>Clear all filters</button>
      )}
    </div>
  );

  return (
    <div className="shop-page">
      <div className="container">
        <header className="shop-page__header">
          <div>
            <h1 className="shop-page__title">{q ? `Results for "${q}"` : 'All Products'}</h1>
            <p className="shop-page__count">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
          </div>
          <div className="shop-page__controls">
            <div className="shop-page__search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search products…"
                value={q}
                onChange={(e) => set('q', e.target.value)}
              />
              {q && <button onClick={() => set('q', '')}><X size={14} /></button>}
            </div>
            <button className="shop-page__filter-btn" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={16} /> Filters
              {activeCount > 0 && <span className="shop-page__filter-count">{activeCount}</span>}
            </button>
          </div>
        </header>

        {/* Category pills */}
        <div className="shop-page__cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`shop-page__cat-pill ${category === cat.id ? 'is-active' : ''}`}
              onClick={() => set('category', cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="shop-page__layout">
          <aside className="shop-page__sidebar">{filterPanel}</aside>

          <div className="shop-page__results">
            {products.length === 0 ? (
              <div className="shop-page__empty">
                <p>No products found.</p>
                <button onClick={clearAll}>Clear filters</button>
              </div>
            ) : (
              <div className="shop-page__grid">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <>
          <div className="overlay" onClick={() => setFiltersOpen(false)} />
          <div className="shop-page__sheet">
            <div className="shop-page__sheet-head">
              <h3>Filters</h3>
              <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
            </div>
            <div className="shop-page__sheet-body">{filterPanel}</div>
            <div className="shop-page__sheet-foot">
              <button className="gold-button" style={{ width: '100%' }} onClick={() => setFiltersOpen(false)}>
                Show {products.length} products
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .shop-page { padding: 40px 0 80px; background: var(--section-bg); min-height: 80vh; }
        .shop-page__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
        .shop-page__title { font-size: 2rem; color: var(--hero-bg); margin-bottom: 4px; }
        .shop-page__count { font-size: 0.85rem; opacity: 0.6; }
        .shop-page__controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .shop-page__search { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 50px; padding: 8px 16px; min-width: 220px; }
        .shop-page__search input { border: none; outline: none; font-family: var(--font-body); font-size: 0.88rem; background: transparent; flex: 1; }
        .shop-page__search button { background: none; border: none; cursor: pointer; color: #999; display: flex; }
        .shop-page__filter-btn { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 50px; padding: 8px 18px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        .shop-page__filter-btn:hover { border-color: var(--accent-gold); color: var(--accent-gold); }
        .shop-page__filter-count { background: var(--hero-bg); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; }
        .shop-page__cats { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 32px; }
        .shop-page__cat-pill { padding: 7px 18px; border-radius: 50px; border: 1.5px solid rgba(0,0,0,0.1); background: white; font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: all 0.3s; }
        .shop-page__cat-pill.is-active, .shop-page__cat-pill:hover { background: var(--hero-bg); color: white; border-color: var(--hero-bg); }
        .shop-page__layout { display: grid; grid-template-columns: 240px 1fr; gap: 32px; }
        .shop-page__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
        .shop-page__empty { text-align: center; padding: 80px 20px; }
        .shop-page__empty p { font-size: 1.1rem; opacity: 0.6; margin-bottom: 16px; }
        .shop-page__empty button { background: var(--hero-bg); color: white; border: none; padding: 10px 24px; border-radius: 50px; cursor: pointer; }

        /* Filters */
        .shop-filters { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .shop-filters__group { margin-bottom: 24px; }
        .shop-filters__group h4 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent-gold); margin-bottom: 12px; font-family: var(--font-body); font-weight: 700; }
        .shop-filters__opt { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 0.88rem; transition: background 0.2s; }
        .shop-filters__opt input { display: none; }
        .shop-filters__opt:hover, .shop-filters__opt.is-active { background: rgba(43,0,24,0.06); color: var(--hero-bg); font-weight: 600; }
        .shop-filters__clear { width: 100%; padding: 10px; background: none; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 50px; font-size: 0.82rem; cursor: pointer; transition: all 0.3s; }
        .shop-filters__clear:hover { border-color: var(--hero-bg); color: var(--hero-bg); }

        /* Product card */
        .scard { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transition: all 0.35s ease; border: 1px solid rgba(0,0,0,0.04); }
        .scard:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); border-color: rgba(212,175,55,0.2); }
        .scard__img-wrap { display: block; position: relative; aspect-ratio: 1; overflow: hidden; background: #fafafa; }
        .scard__img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
        .scard:hover .scard__img-wrap img { transform: scale(1.07); }
        .scard__badge { position: absolute; top: 10px; left: 10px; background: var(--hero-bg); color: var(--accent-gold); font-size: 0.65rem; font-weight: 700; padding: 3px 10px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.08em; }
        .scard__discount { position: absolute; top: 10px; right: 10px; background: #e74c3c; color: white; font-size: 0.65rem; font-weight: 700; padding: 3px 8px; border-radius: 50px; }
        .scard__body { padding: 16px; }
        .scard__cat { font-size: 0.72rem; color: var(--accent-gold); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
        .scard__name { font-size: 0.95rem; font-weight: 700; color: var(--hero-bg); margin-bottom: 6px; line-height: 1.3; }
        .scard__name a { color: inherit; text-decoration: none; }
        .scard__desc { font-size: 0.8rem; opacity: 0.6; line-height: 1.5; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .scard__foot { display: flex; justify-content: space-between; align-items: center; }
        .scard__price-now { font-size: 1.05rem; font-weight: 800; color: var(--hero-bg); }
        .scard__price-mrp { font-size: 0.8rem; text-decoration: line-through; opacity: 0.4; margin-left: 6px; }
        .scard__add { display: flex; align-items: center; gap: 6px; background: var(--hero-bg); color: white; border: none; padding: 7px 14px; border-radius: 50px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.3s; }
        .scard__add:hover { background: var(--accent-gold); color: var(--hero-bg); }
        .scard__qty { display: flex; align-items: center; gap: 0; background: var(--hero-bg); border-radius: 50px; overflow: hidden; }
        .scard__qty button { background: none; border: none; color: white; width: 30px; height: 30px; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .scard__qty button:hover { background: rgba(255,255,255,0.15); }
        .scard__qty span { color: white; font-weight: 700; font-size: 0.88rem; min-width: 24px; text-align: center; }

        /* Mobile filter sheet */
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1100; backdrop-filter: blur(4px); }
        .shop-page__sheet { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-radius: 24px 24px 0 0; z-index: 1200; max-height: 85vh; display: flex; flex-direction: column; }
        .shop-page__sheet-head { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 16px; border-bottom: 1px solid #f0f0f0; }
        .shop-page__sheet-head h3 { font-size: 1.1rem; }
        .shop-page__sheet-head button { background: #f5f5f5; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .shop-page__sheet-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
        .shop-page__sheet-foot { padding: 16px 24px; border-top: 1px solid #f0f0f0; }

        @media (max-width: 900px) {
          .shop-page__layout { grid-template-columns: 1fr; }
          .shop-page__sidebar { display: none; }
        }
        @media (max-width: 600px) {
          .shop-page__grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .shop-page__title { font-size: 1.5rem; }
          .shop-page__search { min-width: 160px; }
        }
      `}</style>
    </div>
  );
}
