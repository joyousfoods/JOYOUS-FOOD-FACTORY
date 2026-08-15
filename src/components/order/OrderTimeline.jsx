import { Check, X, CreditCard, Package, Box, Truck, Bike, Home } from 'lucide-react';
import { formatDateTime, statusLabel } from '../../utils/format';

const FLOW = [
  { status: 'PENDING_PAYMENT', label: 'Order placed', icon: CreditCard },
  { status: 'PROCESSING', label: 'Preparing your order', icon: Package },
  { status: 'PACKED', label: 'Packed', icon: Box },
  { status: 'SHIPPED', label: 'Shipped', icon: Truck },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', icon: Bike },
  { status: 'DELIVERED', label: 'Delivered', icon: Home },
];

/**
 * Renders the order's progress against the standard flow, marking each
 * step with the timestamp from its real OrderEvent row rather than
 * guessing from the current status alone.
 */
export function OrderTimeline({ order, compact = false }) {
  if (order.orderStatus === 'CANCELLED') {
    return (
      <div className="timeline timeline--cancelled">
        <div className="timeline__step is-done">
          <span className="timeline__marker">
            <X size={14} />
          </span>
          <div className="timeline__body">
            <strong>Order cancelled</strong>
            {order.cancelledAt && <span>{formatDateTime(order.cancelledAt)}</span>}
            {order.events?.find((e) => e.status === 'CANCELLED')?.note && (
              <p>{order.events.find((e) => e.status === 'CANCELLED').note}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = FLOW.findIndex((step) => step.status === order.orderStatus);
  const eventByStatus = new Map();
  (order.events || []).forEach((event) => {
    if (!eventByStatus.has(event.status)) eventByStatus.set(event.status, event);
  });

  return (
    <ol className={`timeline ${compact ? 'timeline--compact' : ''}`}>
      {FLOW.map((step, index) => {
        const event = eventByStatus.get(step.status);
        const done = index < currentIndex;
        const active = index === currentIndex;
        const Icon = step.icon;

        return (
          <li
            key={step.status}
            className={`timeline__step ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}
          >
            <span className="timeline__marker">
              {done ? <Check size={14} /> : <Icon size={14} />}
            </span>
            <div className="timeline__body">
              <strong>{step.label}</strong>
              {event ? (
                <span>{formatDateTime(event.createdAt)}</span>
              ) : (
                <span className="timeline__pending">
                  {active ? 'In progress' : 'Pending'}
                </span>
              )}
              {active && event?.note && <p>{event.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderStatusBadge({ status, paymentStatus }) {
  const variant =
    {
      DELIVERED: 'success',
      CANCELLED: 'danger',
      PENDING_PAYMENT: 'warning',
      SHIPPED: 'info',
      OUT_FOR_DELIVERY: 'info',
    }[status] || 'neutral';

  return (
    <span className={`badge badge--${variant}`}>
      {statusLabel(status)}
      {paymentStatus === 'FAILED' && ' · payment failed'}
    </span>
  );
}
