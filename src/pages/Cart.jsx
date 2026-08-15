import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight, Truck, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, itemCount, subtotal, delivery, total, setQuantity, removeItem, clear } = useCart();

  if (itemCount === 0) {
    return (
      <div className="cart-empty">
        <ShoppingBag size={56} strokeWidth={1.2} />
        <h2>Your cart is empty</h2>
        <p>Browse our collection and add something worth waiting for.</p>
        <Link to="/shop" className="gold-button">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <header className="cart-page__header">
          <h1>Your Cart</h1>
          <button className="cart-page__clear" onClick={clear}>Clear cart</button>
        </header>

        <div className="cart-page__layout">
          {/* Items */}
          <div className="cart-page__items">
            {items.map(({ id, product, quantity }) => (
              <div key={id} className="cart-line">
                <Link to={`/product/${product.slug}`} className="cart-line__img">
                  <img src={product.image} alt={product.name} />
                </Link>
                <div className="cart-line__info">
                  <div className="cart-line__top">
                    <div>
                      <h3><Link to={`/product/${product.slug}`}>{product.name}</Link></h3>
                      {product.packLabel && <p className="cart-line__pack">{product.packLabel}</p>}
                      {product.freeShipping && (
                        <span className="cart-line__ship"><Truck size={12} /> Free delivery</span>
                      )}
                    </div>
                    <button className="cart-line__remove" onClick={() => removeItem(id)} aria-label="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="cart-line__bottom">
                    <div className="cart-line__qty">
                      <button onClick={() => quantity === 1 ? removeItem(id) : setQuantity(id, quantity - 1)}><Minus size={13} /></button>
                      <span>{quantity}</span>
                      <button onClick={() => setQuantity(id, quantity + 1)}><Plus size={13} /></button>
                    </div>
                    <div className="cart-line__price">
                      <strong>₹{product.price * quantity}</strong>
                      {product.mrp > product.price && (
                        <span>₹{product.mrp * quantity}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Link to="/shop" className="cart-page__continue">← Continue shopping</Link>
          </div>

          {/* Summary */}
          <aside className="cart-page__summary">
            <div className="summary-box">
              <h2>Order Summary</h2>
              <dl className="summary-box__lines">
                <div><dt>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt><dd>₹{subtotal}</dd></div>
                <div><dt>Delivery</dt><dd>{delivery === 0 ? <span className="free">FREE</span> : `₹${delivery}`}</dd></div>
              </dl>
              {delivery > 0 && (
                <p className="summary-box__nudge">
                  <Truck size={14} /> Add ₹{999 - subtotal} more for free delivery
                </p>
              )}
              <div className="summary-box__total">
                <span>Total</span>
                <strong>₹{total}</strong>
              </div>
              <Link to="/checkout" className="gold-button" style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                Proceed to Checkout <ArrowRight size={17} />
              </Link>
              <p className="summary-box__secure">
                <ShieldCheck size={13} /> Secure checkout · Order via WhatsApp
              </p>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .cart-empty { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; text-align: center; padding: 60px 20px; color: var(--hero-bg); }
        .cart-empty h2 { font-size: 1.8rem; }
        .cart-empty p { opacity: 0.6; margin-bottom: 8px; }
        .cart-page { padding: 60px 0 100px; background: var(--section-bg); min-height: 80vh; }
        .cart-page__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .cart-page__header h1 { font-size: 2rem; color: var(--hero-bg); }
        .cart-page__clear { background: none; border: 1px solid rgba(0,0,0,0.1); padding: 6px 16px; border-radius: 50px; font-size: 0.82rem; cursor: pointer; transition: all 0.3s; }
        .cart-page__clear:hover { border-color: #e74c3c; color: #e74c3c; }
        .cart-page__layout { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
        .cart-page__items { display: flex; flex-direction: column; gap: 16px; }
        .cart-line { display: flex; gap: 16px; background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .cart-line__img { width: 90px; height: 90px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
        .cart-line__img img { width: 100%; height: 100%; object-fit: cover; }
        .cart-line__info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .cart-line__top { display: flex; justify-content: space-between; gap: 12px; }
        .cart-line__top h3 { font-size: 0.95rem; font-weight: 700; color: var(--hero-bg); margin-bottom: 4px; }
        .cart-line__top h3 a { color: inherit; text-decoration: none; }
        .cart-line__pack { font-size: 0.78rem; opacity: 0.6; }
        .cart-line__ship { font-size: 0.72rem; color: #27ae60; display: flex; align-items: center; gap: 4px; margin-top: 4px; }
        .cart-line__remove { background: none; border: none; color: #ccc; cursor: pointer; transition: color 0.2s; padding: 4px; flex-shrink: 0; }
        .cart-line__remove:hover { color: #e74c3c; }
        .cart-line__bottom { display: flex; justify-content: space-between; align-items: center; }
        .cart-line__qty { display: flex; align-items: center; background: var(--hero-bg); border-radius: 50px; overflow: hidden; }
        .cart-line__qty button { background: none; border: none; color: white; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .cart-line__qty button:hover { background: rgba(255,255,255,0.15); }
        .cart-line__qty span { color: white; font-weight: 700; font-size: 0.88rem; min-width: 28px; text-align: center; }
        .cart-line__price strong { font-size: 1rem; font-weight: 800; color: var(--hero-bg); }
        .cart-line__price span { font-size: 0.8rem; text-decoration: line-through; opacity: 0.4; margin-left: 6px; }
        .cart-page__continue { font-size: 0.85rem; color: var(--hero-bg); opacity: 0.6; text-decoration: none; margin-top: 8px; display: inline-block; }
        .cart-page__continue:hover { opacity: 1; }
        .summary-box { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); position: sticky; top: 100px; }
        .summary-box h2 { font-size: 1.2rem; margin-bottom: 20px; color: var(--hero-bg); }
        .summary-box__lines { list-style: none; margin-bottom: 16px; }
        .summary-box__lines div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 0.9rem; }
        .summary-box__lines dt { opacity: 0.7; }
        .summary-box__lines dd { font-weight: 600; }
        .free { color: #27ae60; font-weight: 700; }
        .summary-box__nudge { font-size: 0.78rem; color: #e67e22; display: flex; align-items: center; gap: 6px; margin-bottom: 16px; background: #fff8f0; padding: 8px 12px; border-radius: 8px; }
        .summary-box__total { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; margin-bottom: 20px; border-top: 2px solid var(--hero-bg); }
        .summary-box__total span { font-weight: 600; }
        .summary-box__total strong { font-size: 1.3rem; font-weight: 900; color: var(--hero-bg); }
        .summary-box__secure { text-align: center; font-size: 0.75rem; opacity: 0.5; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 5px; }
        @media (max-width: 900px) {
          .cart-page__layout { grid-template-columns: 1fr; }
          .summary-box { position: static; }
        }
        @media (max-width: 600px) {
          .cart-line__img { width: 70px; height: 70px; }
        }
      `}</style>
    </div>
  );
}
