import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Truck, ShieldCheck, Minus, Plus, ChevronRight } from 'lucide-react';
import { getProductBySlug, PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const product = getProductBySlug(slug);
  const { addItem, getQuantity, setQuantity, removeItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--hero-bg)' }}>Product not found</h2>
        <Link to="/shop" className="gold-button">Back to Shop</Link>
      </div>
    );
  }

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);
  const qty = getQuantity(product.id);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="pd-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/shop">Shop</Link>
          <ChevronRight size={14} />
          <span>{product.name}</span>
        </nav>

        <div className="pd-layout">
          {/* Images */}
          <div className="pd-gallery">
            <div className="pd-gallery__main">
              <img src={allImages[activeImg]} alt={product.name} />
              {product.badge && <span className="pd-badge">{product.badge}</span>}
            </div>
            {allImages.length > 1 && (
              <div className="pd-gallery__thumbs">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    className={`pd-gallery__thumb ${activeImg === i ? 'is-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pd-info">
            <p className="pd-info__cat">{product.flavour}</p>
            <h1 className="pd-info__name">{product.name}</h1>
            {product.packLabel && <p className="pd-info__pack">{product.packLabel}</p>}

            <div className="pd-info__price">
              <span className="pd-info__price-now">₹{product.price}</span>
              {product.mrp > product.price && (
                <>
                  <span className="pd-info__price-mrp">₹{product.mrp}</span>
                  <span className="pd-info__price-save">{discount}% off</span>
                </>
              )}
            </div>

            <p className="pd-info__desc">{product.description}</p>

            {/* Add to cart */}
            <div className="pd-info__actions">
              {qty === 0 ? (
                <button className="pd-info__add" onClick={() => addItem(product)}>
                  <ShoppingCart size={18} /> Add to Cart
                </button>
              ) : (
                <div className="pd-info__qty">
                  <button onClick={() => qty === 1 ? removeItem(product.id) : setQuantity(product.id, qty - 1)}><Minus size={16} /></button>
                  <span>{qty}</span>
                  <button onClick={() => setQuantity(product.id, qty + 1)}><Plus size={16} /></button>
                </div>
              )}
              <Link to="/cart" className="pd-info__cart-link">View Cart →</Link>
            </div>

            {/* Meta */}
            <div className="pd-info__meta">
              {product.freeShipping && (
                <div className="pd-info__meta-item">
                  <Truck size={16} /> Free Shipping
                </div>
              )}
              <div className="pd-info__meta-item">
                <ShieldCheck size={16} /> Fresh & Authentic
              </div>
            </div>

            {/* Details */}
            {(product.shelfLife || product.storage) && (
              <div className="pd-info__details">
                {product.shelfLife && <p><strong>Shelf Life:</strong> {product.shelfLife}</p>}
                {product.storage && <p><strong>Storage:</strong> {product.storage}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="pd-related">
            <h2>You may also like</h2>
            <div className="pd-related__grid">
              {related.map((p) => {
                const rQty = getQuantity(p.id);
                return (
                  <div key={p.id} className="scard">
                    <Link to={`/product/${p.slug}`} className="scard__img-wrap">
                      <img src={p.image} alt={p.name} loading="lazy" />
                      {p.badge && <span className="scard__badge">{p.badge}</span>}
                    </Link>
                    <div className="scard__body">
                      <p className="scard__cat">{p.packLabel}</p>
                      <h3 className="scard__name"><Link to={`/product/${p.slug}`}>{p.name}</Link></h3>
                      <div className="scard__foot">
                        <div className="scard__price">
                          <span className="scard__price-now">₹{p.price}</span>
                          {p.mrp > p.price && <span className="scard__price-mrp">₹{p.mrp}</span>}
                        </div>
                        {rQty === 0 ? (
                          <button className="scard__add" onClick={() => addItem(p)}><ShoppingCart size={14} /> Add</button>
                        ) : (
                          <div className="scard__qty">
                            <button onClick={() => rQty === 1 ? removeItem(p.id) : setQuantity(p.id, rQty - 1)}>−</button>
                            <span>{rQty}</span>
                            <button onClick={() => setQuantity(p.id, rQty + 1)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .pd-page { padding: 40px 0 100px; background: var(--section-bg); min-height: 80vh; }
        .pd-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; opacity: 0.6; margin-bottom: 32px; flex-wrap: wrap; }
        .pd-breadcrumb a { color: var(--hero-bg); text-decoration: none; }
        .pd-breadcrumb a:hover { opacity: 1; color: var(--accent-gold); }
        .pd-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; margin-bottom: 80px; }
        .pd-gallery__main { border-radius: 20px; overflow: hidden; aspect-ratio: 1; background: white; position: relative; box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
        .pd-gallery__main img { width: 100%; height: 100%; object-fit: cover; }
        .pd-badge { position: absolute; top: 16px; left: 16px; background: var(--hero-bg); color: var(--accent-gold); font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.08em; }
        .pd-gallery__thumbs { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
        .pd-gallery__thumb { width: 72px; height: 72px; border-radius: 10px; overflow: hidden; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s; background: white; padding: 0; }
        .pd-gallery__thumb.is-active { border-color: var(--accent-gold); }
        .pd-gallery__thumb img { width: 100%; height: 100%; object-fit: cover; }
        .pd-info__cat { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--accent-gold); font-weight: 700; margin-bottom: 10px; }
        .pd-info__name { font-size: 2rem; color: var(--hero-bg); margin-bottom: 8px; line-height: 1.2; }
        .pd-info__pack { font-size: 0.88rem; opacity: 0.6; margin-bottom: 20px; }
        .pd-info__price { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .pd-info__price-now { font-size: 1.8rem; font-weight: 900; color: var(--hero-bg); }
        .pd-info__price-mrp { font-size: 1rem; text-decoration: line-through; opacity: 0.4; }
        .pd-info__price-save { background: #e8f5e9; color: #27ae60; font-size: 0.8rem; font-weight: 700; padding: 3px 10px; border-radius: 50px; }
        .pd-info__desc { font-size: 0.95rem; line-height: 1.7; opacity: 0.75; margin-bottom: 28px; }
        .pd-info__actions { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .pd-info__add { display: flex; align-items: center; gap: 8px; background: var(--hero-bg); color: white; border: none; padding: 14px 28px; border-radius: 50px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.3s; }
        .pd-info__add:hover { background: var(--accent-gold); color: var(--hero-bg); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,175,55,0.3); }
        .pd-info__qty { display: flex; align-items: center; background: var(--hero-bg); border-radius: 50px; overflow: hidden; }
        .pd-info__qty button { background: none; border: none; color: white; width: 44px; height: 44px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .pd-info__qty button:hover { background: rgba(255,255,255,0.15); }
        .pd-info__qty span { color: white; font-weight: 800; font-size: 1rem; min-width: 36px; text-align: center; }
        .pd-info__cart-link { font-size: 0.88rem; color: var(--accent-gold); font-weight: 700; text-decoration: none; }
        .pd-info__meta { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
        .pd-info__meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; background: white; padding: 8px 14px; border-radius: 50px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); color: var(--hero-bg); font-weight: 600; }
        .pd-info__details { background: white; border-radius: 14px; padding: 18px 20px; font-size: 0.88rem; line-height: 1.7; opacity: 0.75; }
        .pd-info__details p { margin-bottom: 6px; }
        .pd-related h2 { font-size: 1.6rem; color: var(--hero-bg); margin-bottom: 24px; }
        .pd-related__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
        @media (max-width: 900px) {
          .pd-layout { grid-template-columns: 1fr; gap: 32px; }
          .pd-info__name { font-size: 1.6rem; }
        }
      `}</style>
    </div>
  );
}
