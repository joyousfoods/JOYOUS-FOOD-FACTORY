import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * One button. Renders as <button>, <a> or react-router <Link> depending on
 * the props, so a "button" that navigates is still a real link.
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size,
    block = false,
    loading = false,
    disabled = false,
    iconOnly = false,
    className = '',
    children,
    to,
    href,
    type = 'button',
    ...rest
  },
  ref
) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size ? `btn--${size}` : '',
    block ? 'btn--block' : '',
    iconOnly ? 'btn--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {loading && !iconOnly ? <span>Please wait…</span> : children}
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !disabled && !loading) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});
