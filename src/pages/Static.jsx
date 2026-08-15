import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Search,
  Tag,
  Truck,
  ShieldCheck,
  Leaf,
  Gift,
  Users,
  PackageSearch,
  Home as HomeIcon,
} from 'lucide-react';
import { Image } from '../components/ui/Image';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Field';
import { Alert } from '../components/ui/Misc';
import { EmptyState, InlineLoader } from '../components/ui/States';
import { OrderTimeline, OrderStatusBadge } from '../components/order/OrderTimeline';
import { useAsync } from '../hooks/useAsync';
import { orderApi, catalogApi } from '../api';
import { useStoreConfig } from '../context/StoreConfigContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatDateTime } from '../utils/format';

/* ══ ABOUT ═══════════════════════════════════════════════ */

export function About() {
  return (
    <div className="container page">
      <header className="page__header text-center">
        <span className="eyebrow">Our story</span>
        <h1 className="page__title">A legacy of taste, reimagined</h1>
        <p className="page__subtitle" style={{ margin: '0 auto' }}>
          Joyous Food Factory has been making artisanal chocolate beedas in Hyderabad since 2020.
        </p>
      </header>

      <div className="story" style={{ marginBottom: 'var(--space-16)' }}>
        <div className="story__media">
          <Image src="/assets/legacy-product.png" alt="Chocolate beeda cut open" ratio="4/5" />
          <div className="story__frame" />
        </div>
        <div className="story__content">
          <h2 className="section-title">Where it started</h2>
          <p>
            The beeda has been the traditional close to an Indian meal for generations — betel leaf,
            gulkand, fennel, a little sweetness. We wondered what would happen if that tradition met
            the richness of premium chocolate.
          </p>
          <p>
            What came out of that experiment is our chocolate beeda: rose petals, fresh pistachio,
            real saffron and betel leaf wrapped in a chocolate shell and finished by hand, one piece
            at a time.
          </p>
          <p>
            Today we make six flavours plus a honey dry-fruit range, ship across India, and pack gift
            boxes for weddings, festivals and corporate clients. Everything is still made in the same
            Hyderabad kitchen, fresh each morning.
          </p>
        </div>
      </div>

      <section className="about-values">
        {[
          { icon: Leaf, title: 'Real ingredients', body: 'Real saffron, fresh pistachio, pure rose gulkand. No artificial flavouring.' },
          { icon: Clock, title: 'Made the day it ships', body: 'Nothing is stockpiled. Your box is made after you order it.' },
          { icon: ShieldCheck, title: 'FSSAI licensed', body: 'Lic. 23626032002896. Prepared under food-safety standards throughout.' },
          { icon: Gift, title: 'Built for gifting', body: 'Presentation boxes, custom flavours, and bulk orders for events.' },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="about-value">
            <span>
              <Icon size={22} strokeWidth={1.6} />
            </span>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </section>

      <section className="about-cta">
        <h2>Come taste the difference</h2>
        <p>Six flavours, one kitchen, delivered chilled across India.</p>
        <div className="about-cta__actions">
          <Button variant="gold" size="lg" to="/shop">
            Shop the collection
          </Button>
          <Button variant="outline" size="lg" to="/gifting">
            Corporate gifting
          </Button>
        </div>
      </section>
    </div>
  );
}

/* ══ CONTACT ═════════════════════════════════════════════ */

export function Contact() {
  const { support } = useStoreConfig();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });

  const sendViaWhatsApp = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Please add your name and a message');
      return;
    }

    // Opens WhatsApp with the enquiry pre-composed. This is an enquiry, not
    // an order — orders go through checkout so payment can be verified.
    const text = [
      '*Enquiry — Joyous Food Factory*',
      '',
      `Name: ${form.name}`,
      form.phone ? `Phone: ${form.phone}` : null,
      '',
      form.message,
    ]
      .filter(Boolean)
      .join('\n');

    window.open(`https://wa.me/${support.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="container page">
      <header className="page__header text-center">
        <span className="eyebrow">Get in touch</span>
        <h1 className="page__title">We would love to hear from you</h1>
        <p className="page__subtitle" style={{ margin: '0 auto' }}>
          Questions about an order, a custom flavour, or a bulk enquiry — reach us any way you like.
        </p>
      </header>

      <div className="contact">
        <div className="contact__cards">
          <a className="contact__card" href={`tel:${support.phone}`}>
            <Phone size={20} />
            <h3>Call us</h3>
            <p>{support.phone}</p>
            <p>{support.altPhone}</p>
          </a>
          <a className="contact__card" href={`mailto:${support.email}`}>
            <Mail size={20} />
            <h3>Email</h3>
            <p>{support.email}</p>
          </a>
          <div className="contact__card">
            <MapPin size={20} />
            <h3>Visit</h3>
            <p>9th Gokul Plots, KPHB, Hyderabad, Telangana</p>
          </div>
          <div className="contact__card">
            <Clock size={20} />
            <h3>Hours</h3>
            <p>Mon–Sun, 9:00 AM – 6:00 PM</p>
          </div>
        </div>

        <form className="contact__form" onSubmit={sendViaWhatsApp}>
          <h2>Send us a message</h2>
          <p className="account__muted">
            This opens WhatsApp with your message ready to send. For order issues, include your
            order number.
          </p>

          <Field label="Your name" required>
            {(props) => (
              <Input
                {...props}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            )}
          </Field>
          <Field label="Phone number">
            {(props) => (
              <Input
                {...props}
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                }
                placeholder="10-digit mobile number"
                inputMode="numeric"
              />
            )}
          </Field>
          <Field label="Message" required>
            {(props) => (
              <Textarea
                {...props}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="How can we help?"
                rows={5}
              />
            )}
          </Field>

          <Button type="submit" variant="gold" size="lg" block>
            Send via WhatsApp
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ══ GIFTING ═════════════════════════════════════════════ */

export function Gifting() {
  const { support } = useStoreConfig();
  const [form, setForm] = useState({ name: '', company: '', phone: '', quantity: '', occasion: '', notes: '' });
  const toast = useToast();

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Please add your name and phone number');
      return;
    }

    const text = [
      '*Corporate / Bulk Gifting Enquiry*',
      '',
      `Name: ${form.name}`,
      form.company ? `Company: ${form.company}` : null,
      `Phone: ${form.phone}`,
      form.quantity ? `Approx. quantity: ${form.quantity}` : null,
      form.occasion ? `Occasion: ${form.occasion}` : null,
      form.notes ? `\nNotes: ${form.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    window.open(`https://wa.me/${support.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="container page">
      <header className="page__header text-center">
        <span className="eyebrow">Corporate &amp; bulk</span>
        <h1 className="page__title">Gifting, done properly</h1>
        <p className="page__subtitle" style={{ margin: '0 auto' }}>
          Custom flavours, custom boxes, and volume pricing for weddings, festivals and client
          gifting across India.
        </p>
      </header>

      <section className="gifting-features">
        {[
          { icon: Users, title: 'Any volume', body: 'From 50 boxes to several thousand. Commercial packs ship free.' },
          { icon: Gift, title: 'Custom flavours', body: 'Pick your mix. We will make a sample box before you commit.' },
          { icon: Truck, title: 'Delivered on time', body: 'Insulated, chilled shipping to a single address or many.' },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="gifting-feature">
            <Icon size={22} />
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </section>

      <div className="gifting-layout">
        <form className="contact__form" onSubmit={submit}>
          <h2>Request a quote</h2>
          <p className="account__muted">
            Tell us roughly what you need and we will come back with pricing and a sample.
          </p>

          <div className="field-row">
            <Field label="Your name" required>
              {(props) => (
                <Input
                  {...props}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              )}
            </Field>
            <Field label="Company">
              {(props) => (
                <Input
                  {...props}
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              )}
            </Field>
          </div>

          <div className="field-row">
            <Field label="Phone number" required>
              {(props) => (
                <Input
                  {...props}
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  }
                  inputMode="numeric"
                />
              )}
            </Field>
            <Field label="Approximate quantity">
              {(props) => (
                <Input
                  {...props}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 200 boxes"
                />
              )}
            </Field>
          </div>

          <Field label="Occasion">
            {(props) => (
              <Input
                {...props}
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                placeholder="Wedding, Diwali, client gifting…"
              />
            )}
          </Field>

          <Field label="Anything else?">
            {(props) => (
              <Textarea
                {...props}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4}
                placeholder="Branding, delivery dates, flavour preferences…"
              />
            )}
          </Field>

          <Button type="submit" variant="gold" size="lg" block>
            Send enquiry via WhatsApp
          </Button>
        </form>

        <aside className="gifting-aside">
          <Image src="/Combo/B (376) copy.jpg" alt="Gift box" ratio="1" />
          <h3>Prefer to just order?</h3>
          <p>
            Our ready-made gift boxes and commercial packs are available right now, with free
            delivery across India.
          </p>
          <Button variant="outline" block to="/shop?category=gift-boxes">
            Shop gift boxes
          </Button>
          <Button variant="ghost" block to="/shop?tier=BULK">
            Commercial packs
          </Button>
        </aside>
      </div>
    </div>
  );
}

/* ══ OFFERS ══════════════════════════════════════════════ */

export function Offers() {
  const coupons = useAsync(({ signal }) => catalogApi.coupons({ signal }), []);
  const toast = useToast();

  return (
    <div className="container page">
      <header className="page__header text-center">
        <span className="eyebrow">Save more</span>
        <h1 className="page__title">Offers &amp; coupons</h1>
        <p className="page__subtitle" style={{ margin: '0 auto' }}>
          Copy a code and apply it in your cart. Discounts are calculated on your order total.
        </p>
      </header>

      {coupons.loading ? (
        <InlineLoader />
      ) : coupons.data?.items?.length ? (
        <div className="coupon-grid">
          {coupons.data.items.map((coupon) => (
            <div key={coupon.id} className="coupon-card">
              <div className="coupon-card__tag">
                <Tag size={16} />
              </div>
              <div className="coupon-card__body">
                <span className="coupon-card__code">{coupon.code}</span>
                <p>{coupon.description}</p>
                {coupon.minOrderPaise > 0 && (
                  <small>Minimum order {formatPrice(coupon.minOrderPaise)}</small>
                )}
                {coupon.maxDiscountPaise > 0 && (
                  <small>Up to {formatPrice(coupon.maxDiscountPaise)} off</small>
                )}
                <button
                  type="button"
                  className="coupon-card__copy"
                  onClick={() => {
                    navigator.clipboard?.writeText(coupon.code);
                    toast.success(`${coupon.code} copied to clipboard`);
                  }}
                >
                  Copy code
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Tag}
          title="No active offers right now"
          message="New offers land regularly. Subscribe to our newsletter and you will hear first."
          action={
            <Button variant="primary" to="/shop">
              Shop anyway
            </Button>
          }
        />
      )}

      <div style={{ marginTop: 'var(--space-12)', textAlign: 'center' }}>
        <Button variant="gold" size="lg" to="/shop?onOffer=true">
          See discounted products
        </Button>
      </div>
    </div>
  );
}

/* ══ TRACK ORDER ═════════════════════════════════════════ */

export function TrackOrder() {
  const [form, setForm] = useState({ orderNumber: '', phone: '' });
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const { order: found } = await orderApi.track(form.orderNumber.trim(), form.phone.trim());
      setOrder(found);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page">
      <header className="page__header text-center">
        <span className="eyebrow">Order tracking</span>
        <h1 className="page__title">Track your order</h1>
        <p className="page__subtitle" style={{ margin: '0 auto' }}>
          Enter your order number and the phone number on the order.
        </p>
      </header>

      <div className="track">
        <form className="track__form" onSubmit={submit}>
          <Field label="Order number" required>
            {(props) => (
              <Input
                {...props}
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value.toUpperCase() })}
                placeholder="JFF-2608-1234"
                required
              />
            )}
          </Field>
          <Field label="Phone number on the order" required>
            {(props) => (
              <Input
                {...props}
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                }
                placeholder="10-digit mobile number"
                inputMode="numeric"
                required
              />
            )}
          </Field>
          <Button type="submit" variant="primary" size="lg" block loading={loading}>
            <Search size={16} /> Track order
          </Button>
        </form>

        {error && (
          <Alert variant="danger">
            {error} If you have an account,{' '}
            <Link to="/account/orders">check your order history</Link> instead.
          </Alert>
        )}

        {order && (
          <div className="track__result">
            <div className="track__result-head">
              <div>
                <h2>{order.orderNumber}</h2>
                <p className="account__muted">Placed {formatDateTime(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.orderStatus} paymentStatus={order.paymentStatus} />
            </div>

            <OrderTimeline order={order} />

            <div className="track__result-items">
              {order.items.map((item) => (
                <div key={item.id} className="confirmation__item">
                  <Image src={item.imageUrl} alt="" ratio="1" />
                  <div>
                    <strong>{item.productName}</strong>
                    <span>Qty {item.quantity}</span>
                  </div>
                  <strong className="confirmation__item-price">
                    {formatPrice(item.subtotalPaise)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="summary-card__total">
              <span>Order total</span>
              <strong>{formatPrice(order.totalPaise)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ POLICY PAGES ════════════════════════════════════════ */

function PolicyPage({ eyebrow, title, updated, children }) {
  return (
    <div className="container page">
      <div className="policy">
        <header className="page__header">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="page__title">{title}</h1>
          <p className="page__subtitle">Last updated {updated}</p>
        </header>
        <div className="policy__body">{children}</div>
        <footer className="policy__footer">
          <p>
            Questions about this policy? <Link to="/contact">Contact us</Link> — we answer within
            one working day.
          </p>
        </footer>
      </div>
    </div>
  );
}

export function ShippingPolicy() {
  const { delivery } = useStoreConfig();
  return (
    <PolicyPage eyebrow="Policies" title="Shipping &amp; delivery" updated="August 2026">
      <h2>Where we deliver</h2>
      <p>We deliver across India. Some remote PIN codes may not be serviceable by our courier partners; if that applies to your address we will contact you and refund the order in full.</p>

      <h2>Delivery charges</h2>
      <p>
        Delivery is {formatPrice(delivery.feePaise)} on orders below{' '}
        {formatPrice(delivery.freeThresholdPaise)}, and free above that. Gift boxes and commercial
        packs ship free regardless of order value. The exact charge is always shown in your cart
        before you pay.
      </p>

      <h2>Dispatch time</h2>
      <p>Orders placed before 4:00 PM are dispatched the same working day. Orders placed after that, or on a Sunday, are dispatched the next working day. Everything is made fresh after you order, which is why we do not dispatch instantly.</p>

      <h2>Delivery time</h2>
      <p>Typical delivery is 3–6 working days depending on your location. Metro cities are usually faster. You will receive tracking details once your order ships.</p>

      <h2>Packaging</h2>
      <p>Chocolate beedas are perishable and are shipped in insulated boxes with ice packs. On arrival, refrigerate immediately between 4°C and 8°C.</p>

      <h2>If something goes wrong</h2>
      <p>If your order arrives damaged, melted beyond use, or does not arrive at all, contact us within 24 hours of delivery (or the expected delivery date) with your order number and photographs. See our <Link to="/returns-policy">returns and refunds policy</Link>.</p>
    </PolicyPage>
  );
}

export function ReturnsPolicy() {
  return (
    <PolicyPage eyebrow="Policies" title="Returns &amp; refunds" updated="August 2026">
      <h2>Perishable goods</h2>
      <p>Because our products are freshly made perishable food, we cannot accept returns for change of mind, or resell any product once it has left our kitchen. This is a food-safety requirement, not a commercial preference.</p>

      <h2>When we will replace or refund</h2>
      <p>We will replace your order or refund you in full if:</p>
      <ul>
        <li>The product arrives damaged, spoiled, or melted beyond use</li>
        <li>You received the wrong product or the wrong quantity</li>
        <li>Your order does not arrive within 10 working days of dispatch</li>
        <li>We are unable to deliver to your PIN code</li>
      </ul>

      <h2>How to raise a claim</h2>
      <p>Contact us within 24 hours of delivery (or of the expected delivery date) with your order number and clear photographs of the product and packaging. Reach us on WhatsApp, by phone, or through our <Link to="/contact">contact page</Link>.</p>

      <h2>Refund timelines</h2>
      <p>Approved refunds are issued to the original payment method. Razorpay refunds typically reach your account in 5–7 working days depending on your bank. Cash-on-delivery orders are refunded by bank transfer, for which we will ask for your account details directly — never through a link sent by anyone else.</p>

      <h2>Cancellations</h2>
      <p>You can cancel an order from your account at any point before it is dispatched. Once an order has shipped it cannot be cancelled, as the product is already made and in transit.</p>
    </PolicyPage>
  );
}

export function PrivacyPolicy() {
  return (
    <PolicyPage eyebrow="Legal" title="Privacy policy" updated="August 2026">
      <h2>What we collect</h2>
      <p>To take and deliver an order we collect your name, email address, phone number and delivery address. If you create an account we also store a securely hashed version of your password — never the password itself.</p>

      <h2>Payment information</h2>
      <p>We do not see, handle or store your card, UPI or bank details. Payments are processed entirely by Razorpay on their own secure infrastructure. We receive only a payment reference and a success or failure status.</p>

      <h2>How we use your information</h2>
      <p>Your details are used to process and deliver your order, to contact you about that order, and to respond to your enquiries. We share your name, phone number and address with our courier partner solely so they can deliver to you.</p>

      <h2>What we do not do</h2>
      <p>We do not sell your personal information. We do not share it with advertisers. We do not send marketing messages unless you have subscribed to our newsletter, and every newsletter has an unsubscribe option.</p>

      <h2>Cookies and local storage</h2>
      <p>We use a small number of strictly functional cookies and browser storage entries: to keep you signed in, to remember your cart between visits, and to store your recently viewed products locally on your own device.</p>

      <h2>Your rights</h2>
      <p>You can view and edit your details from your account at any time. To request deletion of your account and personal data, <Link to="/contact">contact us</Link> and we will action it within 30 days, subject to any records we are legally required to retain for tax and food-safety purposes.</p>
    </PolicyPage>
  );
}

export function Terms() {
  return (
    <PolicyPage eyebrow="Legal" title="Terms of service" updated="August 2026">
      <h2>Who we are</h2>
      <p>Joyous Food Factory, 9th Gokul Plots, KPHB, Hyderabad, Telangana. FSSAI licence number 23626032002896.</p>

      <h2>Orders</h2>
      <p>An order is confirmed only when payment has been received and verified by our systems, or when a cash-on-delivery order has been accepted. Placing items in a cart does not reserve them.</p>

      <h2>Pricing</h2>
      <p>All prices are in Indian Rupees and include applicable taxes. Prices, offers and product availability may change without notice, but the price shown when you pay is the price you pay. If a pricing error is detected before dispatch, we will contact you and offer either the corrected price or a full refund.</p>

      <h2>Product information</h2>
      <p>We describe our products as accurately as we can. Because everything is handmade, small variations in appearance are normal and are not a defect.</p>

      <h2>Allergens</h2>
      <p>Our products are prepared in a kitchen that handles nuts, dairy and other common allergens. If you have a food allergy, please check with us before ordering.</p>

      <h2>Commercial and bulk orders</h2>
      <p>Commercial packs are sold in the multiples stated on the product page and cannot be combined with retail packs in a single order, as the two are billed and dispatched differently.</p>

      <h2>Liability</h2>
      <p>Our liability for any order is limited to the amount you paid for that order. Nothing in these terms limits any right you have under Indian consumer law.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, and disputes are subject to the jurisdiction of the courts of Hyderabad, Telangana.</p>
    </PolicyPage>
  );
}

/* ══ 404 ═════════════════════════════════════════════════ */

export function NotFound() {
  return (
    <div className="container page">
      <EmptyState
        icon={PackageSearch}
        title="We could not find that page"
        message="The link may be old, or the product may no longer be available. Try the shop, or search for what you were after."
        action={
          <Button variant="primary" to="/shop">
            <Search size={16} /> Browse the shop
          </Button>
        }
        secondaryAction={
          <Button variant="outline" to="/">
            <HomeIcon size={16} /> Back home
          </Button>
        }
      />
    </div>
  );
}
