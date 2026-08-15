import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Truck, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

const WHATSAPP_NUMBER = '919848574748';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal',
];

function Field({ label, error, required, children }) {
  return (
    <div className="co-field">
      {label && <label>{label}{required && ' *'}</label>}
      {children}
      {error && <span className="co-field__err">{error}</span>}
    </div>
  );
}

export default function Checkout() {
  const { items, itemCount, subtotal, delivery, total, clear } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    line1: '', line2: '', city: '', state: 'Telangana', pincode: '',
    note: '',
  });
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (itemCount === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 20px', textAlign: 'center' }}>
        <ShoppingBag size={52} strokeWidth={1.2} color="var(--hero-bg)" />
        <h2 style={{ color: 'var(--hero-bg)' }}>Nothing to check out</h2>
        <p style={{ opacity: 0.6 }}>Your cart is empty.</p>
        <Link to="/shop" className="gold-button">Browse Products</Link>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
    if (form.line1.trim().length < 5) e.line1 = 'Enter your street address';
    if (form.city.trim().length < 2) e.city = 'Enter your city';
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit PIN code';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const now = new Date();
    const ref = `#JFF-${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;

    let msg = `----------------------------\n`;
    msg += `*NEW ORDER ${ref}*\n`;
    msg += `----------------------------\n\n`;
    msg += `*NAME:* ${form.name}\n`;
    msg += `*MOBILE:* ${form.phone}\n`;
    if (form.email) msg += `*EMAIL:* ${form.email}\n`;
    msg += `\n*DELIVERY ADDRESS:*\n`;
    msg += `${form.line1}`;
    if (form.line2) msg += `, ${form.line2}`;
    msg += `\n${form.city}, ${form.state} - ${form.pincode}\n`;
    if (form.note) msg += `\n*NOTE:* ${form.note}\n`;
    msg += `\n*ORDER ITEMS:*\n`;
    items.forEach((item, i) => {
      msg += `${i + 1}. *${item.product.name}*`;
      if (item.product.packLabel) msg += ` (${item.product.packLabel})`;
      msg += `\n   Qty: ${item.quantity} × ₹${item.product.price} = ₹${item.product.price * item.quantity}\n`;
    });
    msg += `\n----------------------------\n`;
    msg += `*SUBTOTAL:* ₹${subtotal}\n`;
    msg += `*DELIVERY:* ${delivery === 0 ? 'FREE' : `₹${delivery}`}\n`;
    msg += `*TOTAL: ₹${total}*\n`;
    msg += `----------------------------\n\n`;
    msg += `_Please confirm my order. Thank you!_`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    clear();
    navigate('/');
  };

  return (
    <div className="co-page">
      <div className="container">
        <header className="co-page__header">
          <h1>Checkout</h1>
          <Link to="/cart" className="co-page__back">← Back to cart</Link>
        </header>

        <div className="co-page__layout">
          <form className="co-form" onSubmit={handleSubmit}>
            {/* Contact */}
            <section className="co-card">
              <h2>Contact Details</h2>
              <div className="co-row">
                <Field label="Full Name" error={errors.name} required>
                  <input className="co-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" autoComplete="name" />
                </Field>
                <Field label="Mobile Number" error={errors.phone} required>
                  <input className="co-input" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile" inputMode="numeric" autoComplete="tel" />
                </Field>
              </div>
              <Field label="Email (optional)">
                <input className="co-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </Field>
            </section>

            {/* Address */}
            <section className="co-card">
              <h2>Delivery Address</h2>
              <Field label="Flat / House No., Street" error={errors.line1} required>
                <input className="co-input" value={form.line1} onChange={(e) => set('line1', e.target.value)} placeholder="e.g. 12-3-45, Gokul Plots, Road No. 4" autoComplete="address-line1" />
              </Field>
              <Field label="Area / Colony (optional)">
                <input className="co-input" value={form.line2} onChange={(e) => set('line2', e.target.value)} placeholder="e.g. KPHB Phase 6" autoComplete="address-line2" />
              </Field>
              <div className="co-row">
                <Field label="City" error={errors.city} required>
                  <input className="co-input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" autoComplete="address-level2" />
                </Field>
                <Field label="PIN Code" error={errors.pincode} required>
                  <input className="co-input" value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit PIN" inputMode="numeric" autoComplete="postal-code" />
                </Field>
              </div>
              <Field label="State" required>
                <select className="co-input" value={form.state} onChange={(e) => set('state', e.target.value)}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </section>

            {/* Note */}
            <section className="co-card">
              <h2>Anything else?</h2>
              <Field label="Delivery instructions / Gift message (optional)">
                <textarea className="co-input" rows={3} value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Ring the bell twice, gift message, etc." />
              </Field>
            </section>

            <button type="submit" className="co-submit">
              <MessageCircle size={20} /> Confirm & Send to WhatsApp
            </button>
            <p className="co-note">Your order details will be pre-filled in WhatsApp. We'll confirm and process your order from there.</p>
          </form>

          {/* Summary */}
          <aside className="co-summary">
            <div className="summary-box">
              <h2>Order Summary</h2>
              <div className="co-items">
                {items.map(({ id, product, quantity }) => (
                  <div key={id} className="co-item">
                    <img src={product.image} alt={product.name} />
                    <div>
                      <p>{product.name}</p>
                      {product.packLabel && <small>{product.packLabel}</small>}
                      <small>Qty: {quantity}</small>
                    </div>
                    <strong>₹{product.price * quantity}</strong>
                  </div>
                ))}
              </div>
              <dl className="summary-box__lines">
                <div><dt>Subtotal</dt><dd>₹{subtotal}</dd></div>
                <div><dt>Delivery</dt><dd>{delivery === 0 ? <span className="free">FREE</span> : `₹${delivery}`}</dd></div>
              </dl>
              <div className="summary-box__total">
                <span>Total</span>
                <strong>₹{total}</strong>
              </div>
              <ul className="co-trust">
                <li><ShieldCheck size={14} /> Secure order via WhatsApp</li>
                <li><Truck size={14} /> Pan India delivery</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .co-page { padding: 60px 0 100px; background: var(--section-bg); min-height: 80vh; }
        .co-page__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .co-page__header h1 { font-size: 2rem; color: var(--hero-bg); }
        .co-page__back { font-size: 0.85rem; color: var(--hero-bg); opacity: 0.6; text-decoration: none; }
        .co-page__back:hover { opacity: 1; }
        .co-page__layout { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
        .co-form { display: flex; flex-direction: column; gap: 20px; }
        .co-card { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .co-card h2 { font-size: 1.1rem; color: var(--hero-bg); margin-bottom: 20px; }
        .co-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .co-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .co-field label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--hero-bg); opacity: 0.7; }
        .co-field__err { font-size: 0.75rem; color: #e74c3c; }
        .co-input { padding: 12px 16px; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px; font-family: var(--font-body); font-size: 0.92rem; background: #fafafa; outline: none; transition: all 0.3s; width: 100%; color: var(--hero-bg, #1a1a1a); }
        .co-input::placeholder { color: #8c8c8c; opacity: 1; }
        .co-input:focus { border-color: var(--accent-gold); background: white; box-shadow: 0 0 0 3px rgba(212,175,55,0.1); }
        .co-submit { display: flex; align-items: center; justify-content: center; gap: 10px; background: #25d366; color: white; border: none; padding: 18px; border-radius: 16px; font-size: 1.05rem; font-weight: 800; cursor: pointer; transition: all 0.3s; width: 100%; }
        .co-submit:hover { background: #1ebe5d; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(37,211,102,0.35); }
        .co-note { text-align: center; font-size: 0.78rem; opacity: 0.5; margin-top: 8px; }
        .co-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
        .co-item { display: flex; align-items: center; gap: 12px; }
        .co-item img { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .co-item div { flex: 1; }
        .co-item p { font-size: 0.85rem; font-weight: 600; color: var(--hero-bg); margin-bottom: 2px; }
        .co-item small { font-size: 0.72rem; opacity: 0.55; display: block; }
        .co-item strong { font-size: 0.9rem; font-weight: 800; color: var(--hero-bg); flex-shrink: 0; }
        .co-trust { list-style: none; margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
        .co-trust li { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; opacity: 0.6; }
        @media (max-width: 900px) {
          .co-page__layout { grid-template-columns: 1fr; }
          .co-summary { order: -1; }
        }
        @media (max-width: 600px) {
          .co-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
