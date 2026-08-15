import { AlertTriangle, WifiOff, PackageOpen, RefreshCw, SearchX } from 'lucide-react';
import { Button } from './Button';

/** Generic empty state — used for empty cart, wishlist, orders, etc. */
export function EmptyState({ icon: Icon = PackageOpen, title, message, action, secondaryAction }) {
  return (
    <div className="state">
      <div className="state__icon">
        <Icon size={30} strokeWidth={1.6} />
      </div>
      <h3 className="state__title">{title}</h3>
      {message && <p className="state__message">{message}</p>}
      {(action || secondaryAction) && (
        <div className="state__actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

/**
 * Distinguishes a dropped connection from a server error, because the two
 * call for different actions from the customer.
 */
export function ErrorState({ error, onRetry, title }) {
  const isNetwork = error?.isNetworkError || error?.code === 'NETWORK_ERROR';

  return (
    <div className="state state--error">
      <div className="state__icon">
        {isNetwork ? <WifiOff size={30} strokeWidth={1.6} /> : <AlertTriangle size={30} strokeWidth={1.6} />}
      </div>
      <h3 className="state__title">
        {title || (isNetwork ? 'No connection' : 'Something went wrong')}
      </h3>
      <p className="state__message">
        {isNetwork
          ? 'We could not reach our servers. Check your internet connection and try again.'
          : error?.message || 'An unexpected error occurred. Please try again in a moment.'}
      </p>
      {onRetry && (
        <div className="state__actions">
          <Button variant="primary" onClick={onRetry}>
            <RefreshCw size={16} /> Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export function NoResultsState({ query, onClear, suggestions = [] }) {
  return (
    <div className="state">
      <div className="state__icon">
        <SearchX size={30} strokeWidth={1.6} />
      </div>
      <h3 className="state__title">
        {query ? `No results for "${query}"` : 'No products match these filters'}
      </h3>
      <p className="state__message">
        Try a different spelling, a broader search, or clear a filter or two.
      </p>
      {suggestions.length > 0 && (
        <div className="state__actions">
          {suggestions.map((suggestion) => (
            <Button key={suggestion.label} variant="subtle" size="sm" to={suggestion.to}>
              {suggestion.label}
            </Button>
          ))}
        </div>
      )}
      {onClear && (
        <div className="state__actions">
          <Button variant="outline" onClick={onClear}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}

export function Spinner({ size = 20, label = 'Loading' }) {
  return (
    <span
      className="btn__spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 10) }}
      role="status"
      aria-label={label}
    />
  );
}

export function InlineLoader({ label = 'Loading…' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '48px 0',
        color: 'var(--ink-500)',
      }}
    >
      <Spinner />
      <span style={{ fontSize: 'var(--text-sm)' }}>{label}</span>
    </div>
  );
}
