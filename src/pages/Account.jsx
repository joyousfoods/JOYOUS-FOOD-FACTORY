import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Heart,
  Tag,
  Bell,
  Settings,
  LogOut,
  RotateCcw,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import { Image } from '../components/ui/Image';
import { Button } from '../components/ui/Button';
import { Field, Input, Checkbox } from '../components/ui/Field';
import { Alert, Badge } from '../components/ui/Misc';
import { EmptyState, ErrorState, InlineLoader } from '../components/ui/States';
import { OrderTimeline, OrderStatusBadge } from '../components/order/OrderTimeline';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { addressApi, orderApi, notificationApi, catalogApi } from '../api';
import { formatPrice, formatDate, formatDateTime, formatRelative } from '../utils/format';

const NAV = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'My orders', icon: Package },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/coupons', label: 'Coupons', icon: Tag },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
  { to: '/account/settings', label: 'Settings', icon: Settings },
];

/** Shared shell — sidebar nav plus the routed sub-page. */
export function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container page account">
      <header className="account__header">
        <div>
          <h1 className="page__title">My account</h1>
          <p className="page__subtitle">
            Signed in as <strong>{user?.email}</strong>
          </p>
        </div>
      </header>

      <div className="account__layout">
        <aside className="account__nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `account__nav-link ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
              <ChevronRight size={15} className="account__nav-chevron" />
            </NavLink>
          ))}
          <button
            type="button"
            className="account__nav-link account__nav-link--danger"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </aside>

        <div className="account__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────── */

export function AccountProfile() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const orders = useAsync(() => orderApi.list({ limit: 3 }), []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: form.name, phone: form.phone });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="account__card">
        <h2>Your details</h2>
        <form className="account__form" onSubmit={save}>
          <div className="field-row">
            <Field label="Full name">
              {(props) => (
                <Input
                  {...props}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              )}
            </Field>
            <Field label="Mobile number">
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
          </div>
          <Field label="Email address" hint="Email cannot be changed. Contact us if you need to.">
            {(props) => <Input {...props} value={user?.email || ''} disabled />}
          </Field>
          <Button type="submit" variant="primary" loading={saving}>
            Save changes
          </Button>
        </form>
      </section>

      <section className="account__card">
        <div className="account__card-head">
          <h2>Recent orders</h2>
          <Link to="/account/orders">View all</Link>
        </div>

        {orders.loading ? (
          <InlineLoader />
        ) : orders.data?.items?.length ? (
          <div className="order-list">
            {orders.data.items.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No orders yet"
            message="Once you place an order it will appear here."
            action={
              <Button variant="primary" to="/shop">
                Start shopping
              </Button>
            }
          />
        )}
      </section>
    </>
  );
}

/* ── Orders ──────────────────────────────────────────────── */

function OrderRow({ order }) {
  const navigate = useNavigate();
  const cart = useCart();
  const toast = useToast();
  const [reordering, setReordering] = useState(false);

  const reorder = async () => {
    setReordering(true);
    try {
      const { skipped } = await orderApi.reorder(order.id);
      await cart.refresh();
      if (skipped?.length) {
        toast.info(
          `${skipped.length} item${skipped.length === 1 ? '' : 's'} could not be added — ${skipped[0].reason.toLowerCase()}`
        );
      } else {
        toast.success('Your previous order is back in the cart');
      }
      navigate('/cart');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReordering(false);
    }
  };

  return (
    <article className="order-row">
      <div className="order-row__head">
        <div>
          <Link to={`/account/orders/${order.id}`} className="order-row__number">
            {order.orderNumber}
          </Link>
          <span className="order-row__date">{formatDate(order.createdAt)}</span>
        </div>
        <OrderStatusBadge status={order.orderStatus} paymentStatus={order.paymentStatus} />
      </div>

      <div className="order-row__items">
        {order.items.slice(0, 4).map((item) => (
          <Image key={item.id} src={item.imageUrl} alt={item.productName} ratio="1" />
        ))}
        {order.items.length > 4 && (
          <span className="order-row__more">+{order.items.length - 4}</span>
        )}
      </div>

      <div className="order-row__foot">
        <div>
          <span>
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </span>
          <strong>{formatPrice(order.totalPaise)}</strong>
        </div>
        <div className="order-row__actions">
          <Button variant="ghost" size="sm" onClick={reorder} loading={reordering}>
            <RotateCcw size={14} /> Reorder
          </Button>
          <Button variant="outline" size="sm" to={`/account/orders/${order.id}`}>
            Details
          </Button>
        </div>
      </div>
    </article>
  );
}

export function AccountOrders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const orders = useAsync(
    () => orderApi.list({ page, limit: 10, status: status || undefined }),
    [page, status]
  );

  return (
    <section className="account__card">
      <div className="account__card-head">
        <h2>My orders</h2>
        <select
          className="select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ width: 'auto' }}
        >
          <option value="">All orders</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {orders.loading ? (
        <InlineLoader />
      ) : orders.error ? (
        <ErrorState error={orders.error} onRetry={orders.refetch} />
      ) : orders.data.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={status ? 'No orders with that status' : 'No orders yet'}
          message={
            status
              ? 'Try a different filter to see your other orders.'
              : 'When you place your first order it will show up here with live tracking.'
          }
          action={
            <Button variant="primary" to="/shop">
              Browse products
            </Button>
          }
        />
      ) : (
        <>
          <div className="order-list">
            {orders.data.items.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>

          {orders.data.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="pagination__btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                Previous
              </button>
              <span className="pagination__ellipsis">
                Page {page} of {orders.data.totalPages}
              </span>
              <button
                type="button"
                className="pagination__btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= orders.data.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function AccountOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const toast = useToast();
  const [cancelling, setCancelling] = useState(false);

  const { data, loading, error, refetch } = useAsync(() => orderApi.detail(orderId), [orderId]);

  if (loading) return <InlineLoader />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const order = data.order;
  const cancellable = ['PENDING_PAYMENT', 'PROCESSING', 'PACKED'].includes(order.orderStatus);

  const cancel = async () => {
    if (!window.confirm(`Cancel order ${order.orderNumber}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      await orderApi.cancel(order.id, 'Changed my mind');
      toast.success('Order cancelled');
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <section className="account__card">
        <div className="account__card-head">
          <div>
            <h2>{order.orderNumber}</h2>
            <p className="account__muted">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.orderStatus} paymentStatus={order.paymentStatus} />
        </div>

        {order.paymentStatus === 'FAILED' && (
          <Alert variant="danger" icon={XCircle}>
            The payment for this order did not go through. Nothing was charged.
          </Alert>
        )}

        <OrderTimeline order={order} />
      </section>

      <section className="account__card">
        <h2>Items</h2>
        <div className="confirmation__items">
          {order.items.map((item) => (
            <div key={item.id} className="confirmation__item">
              <Image src={item.imageUrl} alt="" ratio="1" />
              <div>
                <strong>
                  {item.productSlug ? (
                    <Link to={`/product/${item.productSlug}`}>{item.productName}</Link>
                  ) : (
                    item.productName
                  )}
                </strong>
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

        <dl className="summary-card__lines" style={{ marginTop: 'var(--space-5)' }}>
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
          <span>Total</span>
          <strong>{formatPrice(order.totalPaise)}</strong>
        </div>
      </section>

      <section className="account__card">
        <h2>Delivery &amp; payment</h2>
        <div className="order-detail__meta">
          <div>
            <h3>Shipping to</h3>
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
          </div>
          <div>
            <h3>Payment</h3>
            <p>
              {order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Razorpay'}
              <br />
              <Badge
                variant={
                  order.paymentStatus === 'PAID'
                    ? 'success'
                    : order.paymentStatus === 'FAILED'
                      ? 'danger'
                      : 'warning'
                }
              >
                {order.paymentStatus}
              </Badge>
            </p>
            {order.razorpayPaymentId && (
              <p className="confirmation__mono">{order.razorpayPaymentId}</p>
            )}
          </div>
        </div>

        <div className="order-detail__actions">
          <Button
            variant="primary"
            onClick={async () => {
              await orderApi.reorder(order.id);
              await cart.refresh();
              toast.success('Items added to your cart');
              navigate('/cart');
            }}
          >
            <RotateCcw size={15} /> Reorder
          </Button>
          {cancellable && (
            <Button variant="ghost" onClick={cancel} loading={cancelling}>
              Cancel order
            </Button>
          )}
          <Button variant="ghost" to="/contact">
            Need help?
          </Button>
        </div>
      </section>
    </>
  );
}

/* ── Addresses ───────────────────────────────────────────── */

const emptyAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: 'Telangana',
  pincode: '',
  type: 'HOME',
  isDefault: false,
};

export function AccountAddresses() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { items: fetched } = await addressApi.list();
      setItems(fetched);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing === 'new') await addressApi.create(form);
      else await addressApi.update(editing, form);
      toast.success('Address saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <InlineLoader />;

  return (
    <section className="account__card">
      <div className="account__card-head">
        <h2>Saved addresses</h2>
        {!editing && (
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              setForm(emptyAddress);
              setEditing('new');
            }}
          >
            <Plus size={15} /> Add address
          </Button>
        )}
      </div>

      {editing ? (
        <form className="account__form" onSubmit={save}>
          <div className="field-row">
            <Field label="Full name" required>
              {(props) => (
                <Input
                  {...props}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              )}
            </Field>
            <Field label="Phone" required>
              {(props) => (
                <Input
                  {...props}
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  }
                  inputMode="numeric"
                  required
                />
              )}
            </Field>
          </div>
          <Field label="Address line 1" required>
            {(props) => (
              <Input
                {...props}
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                required
              />
            )}
          </Field>
          <Field label="Address line 2">
            {(props) => (
              <Input
                {...props}
                value={form.line2}
                onChange={(e) => setForm({ ...form, line2: e.target.value })}
              />
            )}
          </Field>
          <div className="field-row">
            <Field label="City" required>
              {(props) => (
                <Input
                  {...props}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              )}
            </Field>
            <Field label="PIN code" required>
              {(props) => (
                <Input
                  {...props}
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                  }
                  inputMode="numeric"
                  required
                />
              )}
            </Field>
          </div>
          <div className="field-row">
            <Field label="State" required>
              {(props) => (
                <Input
                  {...props}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                />
              )}
            </Field>
            <Field label="Type">
              {(props) => (
                <select
                  {...props}
                  className="select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
              )}
            </Field>
          </div>
          <Checkbox
            label="Make this my default address"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          <div className="account__form-actions">
            <Button type="submit" variant="primary" loading={saving}>
              Save address
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          message="Save an address now and checkout becomes a two-tap affair."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setForm(emptyAddress);
                setEditing('new');
              }}
            >
              Add your first address
            </Button>
          }
        />
      ) : (
        <div className="address-list">
          {items.map((address) => (
            <div key={address.id} className="address-option is-static">
              <div className="address-option__body">
                <div className="address-option__head">
                  <strong>{address.fullName}</strong>
                  <span className="badge badge--neutral">{address.type}</span>
                  {address.isDefault && <span className="badge badge--gold">Default</span>}
                </div>
                <div className="address-option__text">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ''}
                  <br />
                  {address.city}, {address.state} {address.pincode}
                  <br />
                  {address.phone}
                </div>
              </div>
              <div className="address-option__actions">
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={async () => {
                      await addressApi.setDefault(address.id);
                      load();
                    }}
                    title="Set as default"
                  >
                    <MapPin size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setForm(address);
                    setEditing(address.id);
                  }}
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Delete this address?')) return;
                    await addressApi.remove(address.id);
                    toast.success('Address removed');
                    load();
                  }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Coupons ─────────────────────────────────────────────── */

export function AccountCoupons() {
  const coupons = useAsync(() => catalogApi.coupons(), []);
  const toast = useToast();

  return (
    <section className="account__card">
      <h2>Available coupons</h2>
      <p className="account__muted">Apply any of these in your cart or at checkout.</p>

      {coupons.loading ? (
        <InlineLoader />
      ) : coupons.data?.items?.length ? (
        <div className="coupon-grid" style={{ marginTop: 'var(--space-4)' }}>
          {coupons.data.items.map((coupon) => (
            <div key={coupon.id} className="coupon-card">
              <div className="coupon-card__tag">
                <Tag size={15} />
              </div>
              <div className="coupon-card__body">
                <span className="coupon-card__code">{coupon.code}</span>
                <p>{coupon.description}</p>
                {coupon.minOrderPaise > 0 && (
                  <small>Minimum order {formatPrice(coupon.minOrderPaise)}</small>
                )}
                {coupon.expiresAt && <small>Expires {formatDate(coupon.expiresAt)}</small>}
                <button
                  type="button"
                  className="coupon-card__copy"
                  onClick={() => {
                    navigator.clipboard?.writeText(coupon.code);
                    toast.success(`${coupon.code} copied`);
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
          message="Check back soon, or subscribe to our newsletter to hear first."
        />
      )}
    </section>
  );
}

/* ── Notifications ───────────────────────────────────────── */

export function AccountNotifications() {
  const { data, loading, error, refetch } = useAsync(() => notificationApi.list(), []);

  useEffect(() => {
    // Opening the page is the read receipt.
    if (data?.unreadCount > 0) {
      notificationApi.markRead().then(refetch).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.unreadCount]);

  if (loading) return <InlineLoader />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <section className="account__card">
      <h2>Notifications</h2>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing here yet"
          message="Order updates and offers will appear here as they happen."
        />
      ) : (
        <div className="notification-list">
          {data.items.map((notification) => (
            <article
              key={notification.id}
              className={`notification ${notification.isRead ? '' : 'is-unread'}`}
            >
              <span className="notification__dot" />
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
                <span>{formatRelative(notification.createdAt)}</span>
              </div>
              {notification.linkUrl && (
                <Link to={notification.linkUrl} className="notification__link">
                  <ChevronRight size={16} />
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Settings ────────────────────────────────────────────── */

export function AccountSettings() {
  const { changePassword, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirm) {
      setError('The two new passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed. Please sign in again.');
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="account__card">
      <h2>Change password</h2>
      <p className="account__muted">
        Changing your password signs you out of every device, including this one.
      </p>

      <form className="account__form" onSubmit={submit}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Field label="Current password" required>
          {(props) => (
            <Input
              {...props}
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              autoComplete="current-password"
              required
            />
          )}
        </Field>
        <Field label="New password" hint="At least 8 characters, with a letter and a number" required>
          {(props) => (
            <Input
              {...props}
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              autoComplete="new-password"
              required
            />
          )}
        </Field>
        <Field label="Confirm new password" required>
          {(props) => (
            <Input
              {...props}
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              autoComplete="new-password"
              required
            />
          )}
        </Field>

        <Button type="submit" variant="primary" loading={saving}>
          Update password
        </Button>
      </form>
    </section>
  );
}

/* ── Wishlist (standalone page too) ──────────────────────── */

export function WishlistPage() {
  const wishlist = useWishlist();
  const { isAuthenticated, initialising } = useAuth();

  useEffect(() => {
    if (isAuthenticated) wishlist.loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (initialising) return <InlineLoader />;

  if (!isAuthenticated) {
    return (
      <div className="container page">
        <EmptyState
          icon={Heart}
          title="Sign in to see your wishlist"
          message="Your saved items follow you across devices once you have an account."
          action={
            <Button variant="primary" to="/login?next=/wishlist">
              Sign in
            </Button>
          }
          secondaryAction={
            <Button variant="outline" to="/register?next=/wishlist">
              Create account
            </Button>
          }
        />
      </div>
    );
  }

  if (wishlist.loading) return <InlineLoader />;

  if (wishlist.items.length === 0) {
    return (
      <div className="container page">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          message="Tap the heart on any product to save it here for later."
          action={
            <Button variant="primary" to="/shop">
              Browse products
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <header className="page__header">
        <h1 className="page__title">Your wishlist</h1>
        <p className="page__subtitle">
          {wishlist.items.length} saved {wishlist.items.length === 1 ? 'item' : 'items'} · Prices
          shown are live
        </p>
      </header>

      <div className="wishlist-grid">
        {wishlist.items.map(({ product, addedAt }) => (
          <article key={product.id} className="wishlist-item">
            <Link to={`/product/${product.slug}`} className="wishlist-item__media">
              <Image src={product.imageUrl} alt={product.name} ratio="1" />
            </Link>

            <div className="wishlist-item__body">
              <h3>
                <Link to={`/product/${product.slug}`}>{product.name}</Link>
              </h3>
              {product.packLabel && <p>{product.packLabel}</p>}

              <div className="price">
                <span className="price__current">{formatPrice(product.pricePaise)}</span>
                {product.mrpPaise > product.pricePaise && (
                  <>
                    <span className="price__mrp">{formatPrice(product.mrpPaise)}</span>
                    <span className="price__off">{product.discountPercent}% off</span>
                  </>
                )}
              </div>

              <span className={`badge badge--${product.inStock ? 'success' : 'danger'}`}>
                {product.inStock ? 'In stock' : 'Sold out'}
              </span>

              <span className="wishlist-item__added">Saved {formatRelative(addedAt)}</span>

              <div className="wishlist-item__actions">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!product.inStock}
                  loading={wishlist.isPending(product.id)}
                  onClick={() => wishlist.moveToCart(product)}
                >
                  <ShoppingBag size={14} /> Move to cart
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={() => wishlist.toggle(product)}
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
