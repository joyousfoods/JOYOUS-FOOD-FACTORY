import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Locks background scroll, closes on Escape and on overlay click, and
 * restores focus to whatever opened it.
 */
function useDialogBehaviour(open, onClose) {
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocus.current = document.activeElement;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Compensate for the scrollbar so the page doesn't jump on open.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, children, footer, wide = false, labelledBy }) {
  useDialogBehaviour(open, onClose);

  if (!open) return null;

  return createPortal(
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy || 'modal-title'}>
        <div className={`modal__panel ${wide ? 'modal__panel--wide' : ''}`}>
          {title && (
            <header className="modal__header">
              <h2 className="modal__title" id="modal-title">
                {title}
              </h2>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </header>
          )}
          <div className="modal__body">{children}</div>
          {footer && <footer className="modal__footer">{footer}</footer>}
        </div>
      </div>
    </>,
    document.body
  );
}

export function Drawer({ open, onClose, title, children, footer, side = 'right' }) {
  useDialogBehaviour(open, onClose);

  if (!open) return null;

  return createPortal(
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <aside
        className={`drawer ${side === 'left' ? 'drawer--left' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="drawer__header">
          <h2 className="drawer__title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className="drawer__body">{children}</div>
        {footer && <footer className="drawer__footer">{footer}</footer>}
      </aside>
    </>,
    document.body
  );
}
