import { useId } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Label + control + error, wired together with a generated id so the label
 * is always clickable and screen readers announce the error.
 */
export function Field({ label, error, hint, required, children, className = '' }) {
  const id = useId();

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && <span className="field__required"> *</span>}
        </label>
      )}
      {typeof children === 'function'
        ? children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined })
        : children}
      {error && (
        <span className="field__error" id={`${id}-error`} role="alert">
          <AlertCircle size={13} /> {error}
        </span>
      )}
      {!error && hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`input ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`textarea ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`select ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`check ${className}`}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
