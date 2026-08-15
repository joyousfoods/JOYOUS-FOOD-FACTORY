import { useCallback, useRef } from 'react';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Loads Razorpay's checkout script on demand.
 *
 * Deliberately NOT loaded in index.html: it is a third-party script that
 * only the checkout page needs, and pulling it in on every page view would
 * cost every visitor who never reaches checkout.
 */
function loadScript() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const instanceRef = useRef(null);

  /**
   * Opens Razorpay Checkout.
   *
   * `gateway` comes straight from our backend's order response — it carries
   * the public key id and the gateway order id. The amount is displayed
   * from the same server-computed figure the gateway order was created
   * with, so the modal can never show a different price to what is charged.
   */
  const openCheckout = useCallback(async ({ gateway, onSuccess, onFailure, onDismiss }) => {
    const loaded = await loadScript();
    if (!loaded) {
      onFailure?.({
        code: 'SCRIPT_LOAD_FAILED',
        description:
          'We could not load the payment window. Check your connection or any ad blocker, then try again.',
      });
      return;
    }

    const options = {
      key: gateway.keyId,
      order_id: gateway.razorpayOrderId,
      amount: gateway.amountPaise,
      currency: gateway.currency || 'INR',
      name: 'Joyous Food Factory',
      description: `Order ${gateway.orderNumber}`,
      image: '/logo-removebg-preview.png',
      prefill: gateway.prefill,
      notes: { orderNumber: gateway.orderNumber },
      theme: { color: '#2B0018' },
      // The handler payload is verified server-side before anything is
      // treated as paid — see POST /api/payments/verify.
      handler: (response) =>
        onSuccess?.({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      modal: {
        ondismiss: () => onDismiss?.(),
        escape: true,
        confirm_close: true,
      },
    };

    const instance = new window.Razorpay(options);
    instanceRef.current = instance;

    instance.on('payment.failed', (response) => {
      onFailure?.({
        code: response.error?.code,
        description: response.error?.description,
        paymentId: response.error?.metadata?.payment_id,
      });
    });

    instance.open();
  }, []);

  return { openCheckout };
}
