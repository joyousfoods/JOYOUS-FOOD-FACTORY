import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Truck,
  Package,
  Clock,
  Download,
  ArrowRight,
  MapPin,
  Wallet,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { Image } from '../components/ui/Image';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Misc';
import { ErrorState, InlineLoader } from '../components/ui/States';
import { OrderTimeline } from '../components/order/OrderTimeline';
import { useAsync } from '../hooks/useAsync';
import { orderApi } from '../api';
import { formatPrice, formatDateTime } from '../utils/format';

/** Estimated arrival window, stated as a range so it is never a promise. */
function estimatedDelivery(placedAt) {
  const base = new Date(placedAt || Date.now());
  const from = new Date(base);
  from.setDate(from.getDate() + 3);
  const to = new Date(base);
  to.setDate(to.getDate() + 6);

  const fmt = (date) =>
    new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(
      date
    );

  return `${fmt(from)} – ${fmt(to)}`;
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { data, loading, error, refetch } = useAsync(() => orderApi.detail(orderId), [orderId]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (loading) return <InlineLoader label="Fetching your order…" />;
  if (error) {
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={refetch} title="Could not load this order" />
      </div>
    );
  }

  const order = data.order;
  const isPaid = order.paymentStatus === 'PAID';
  const isCod = order.paymentMethod === 'COD';
  const awaitingPayment = order.orderStatus === 'PENDING_PAYMENT';

  return (
    <div className="container page confirmation">
      <div className="confirmation__hero">
        <span className={`confirmation__icon ${awaitingPayment ? 'is-pending' : ''}`}>
          {awaitingPayment ? <Clock size={34} /> : <CheckCircle2 size={34} />}
        </span>

        <h1>
          {awaitingPayment
            ? 'Order created — payment pending'
            : isCod
              ? 'Order confirmed'
              : 'Payment received'}
        </h1>

        <p>
          {awaitingPayment
            ? 'We have saved your order but have not received the payment yet.'
            : `Thank you, ${order.customerName.split(' ')[0]}. We have started preparing your order.`}
        </p>

        <div className="confirmation__number">
          <span>Order number</span>
          <strong>{order.orderNumber}</strong>
        </div>

        {!awaitingPayment && (
          <p className="confirmation__note">
            A confirmation has gone to <strong>{order.customerEmail}</strong> and our kitchen has
            been notified.
          </p>
        )}
      </div>

      {awaitingPayment && (
        <Alert variant="warning" icon={AlertTriangle}>
          This order will be held until payment is completed. If money left your account, it will
          be confirmed automatically once your bank notifies us — no need to pay twice.
        </Alert>
      )}

      <div className="confirmation__grid">
        <div className="confirmation__main">
          {/* Status */}
          <section className="confirmation__card">
            <h2>Order status</h2>
            <OrderTimeline order={order} />
          </section>

          {/* Items */}
          <section className="confirmation__card">
            <h2>What you ordered</h2>
            <div className="confirmation__items">
              {order.items.map((item) => (
                <div key={item.id} className="confirmation__item">
                  <Image src={item.imageUrl} alt="" ratio="1" />
                  <div>
                    <strong>{item.productName}</strong>
                    {item.packLabel && <span>{item.packLabel}</span>}
                    <span>
                      {formatPrice(item.unitPricePaise)} × {item.quantity}
                    </span>
                  </div>
                  <strong className="confirmation__item-price">
                    {formatPrice(item.subtotalPaise)}
                  </strong>
                </div>
              ))}
            </div>

            <dl className="summary-card__lines" style={{ marginTop: 'var(--space-4)' }}>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotalPaise)}</dd>
              </div>
              {order.discountPaise > 0 && (
                <div className="is-saving">
                  <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
                  <dd>-{formatPrice(order.discountPaise)}</dd>
                </div>
              )}
              <div>
                <dt>Delivery</dt>
                <dd>
                  {order.deliveryPaise === 0 ? (
                    <span className="is-free">FREE</span>
                  ) : (
                    formatPrice(order.deliveryPaise)
                  )}
                </dd>
              </div>
            </dl>

            <div className="summary-card__total">
              <span>{isCod && !isPaid ? 'Amount due on delivery' : 'Total paid'}</span>
              <strong>{formatPrice(order.totalPaise)}</strong>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="confirmation__side">
          <section className="confirmation__card">
            <h3>
              <MapPin size={16} /> Delivery address
            </h3>
            <address>
              <strong>{order.shippingSnapshot.fullName}</strong>
              <br />
              {order.shippingSnapshot.line1}
              {order.shippingSnapshot.line2 && (
                <>
                  <br />
                  {order.shippingSnapshot.line2}
                </>
              )}
              <br />
              {order.shippingSnapshot.city}, {order.shippingSnapshot.state}{' '}
              {order.shippingSnapshot.pincode}
              <br />
              {order.shippingSnapshot.phone}
            </address>
          </section>

          <section className="confirmation__card">
            <h3>
              {isCod ? <Wallet size={16} /> : <CreditCard size={16} />} Payment
            </h3>
            <dl className="confirmation__meta">
              <dt>Method</dt>
              <dd>{isCod ? 'Cash on delivery' : 'Razorpay'}</dd>
              <dt>Status</dt>
              <dd>
                <span className={`badge badge--${isPaid ? 'success' : awaitingPayment ? 'warning' : 'info'}`}>
                  {isPaid ? 'Paid' : isCod ? 'Due on delivery' : order.paymentStatus}
                </span>
              </dd>
              {order.razorpayPaymentId && (
                <>
                  <dt>Payment ID</dt>
                  <dd className="confirmation__mono">{order.razorpayPaymentId}</dd>
                </>
              )}
              <dt>Placed</dt>
              <dd>{formatDateTime(order.createdAt)}</dd>
            </dl>
          </section>

          <section className="confirmation__card">
            <h3>
              <Truck size={16} /> Delivery
            </h3>
            <p className="confirmation__eta">
              Estimated arrival
              <strong>{estimatedDelivery(order.placedAt || order.createdAt)}</strong>
            </p>
            <p className="confirmation__eta-note">
              Orders are dispatched within 24 hours in insulated packaging with ice packs.
            </p>
          </section>

          <div className="confirmation__actions">
            <Button variant="primary" block to={`/account/orders/${order.id}`}>
              <Package size={16} /> View order
            </Button>
            <Button variant="outline" block to="/shop">
              Continue shopping <ArrowRight size={15} />
            </Button>
            <Button variant="ghost" block onClick={() => window.print()}>
              <Download size={15} /> Print this page
            </Button>
          </div>
        </aside>
      </div>

      <p className="confirmation__support">
        Questions about this order? <Link to="/contact">Contact us</Link> with your order number,
        or message us on WhatsApp.
      </p>
    </div>
  );
}
