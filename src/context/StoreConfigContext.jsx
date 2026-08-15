import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { catalogApi } from '../api';

const StoreConfigContext = createContext(null);

export const useStoreConfig = () => {
  const ctx = useContext(StoreConfigContext);
  if (!ctx) throw new Error('useStoreConfig must be used within a StoreConfigProvider');
  return ctx;
};

/**
 * Delivery thresholds, live payment methods and support numbers come from
 * the server so the storefront never hardcodes a value the backend also
 * enforces (and the two can never disagree).
 */
const FALLBACK = {
  currency: 'INR',
  delivery: { feePaise: 9000, freeThresholdPaise: 99900 },
  payments: { razorpayEnabled: false, razorpayKeyId: null, codEnabled: true, codMaxOrderPaise: 1000000 },
  support: {
    phone: '+919848574748',
    altPhone: '+919666255559',
    email: 'joyousfoodshyd@gmail.com',
    whatsapp: '919848574748',
  },
};

export function StoreConfigProvider({ children }) {
  const [config, setConfig] = useState(FALLBACK);
  const [categories, setCategories] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([catalogApi.config(), catalogApi.categories()]).then(
      ([configResult, categoryResult]) => {
        if (cancelled) return;
        if (configResult.status === 'fulfilled') setConfig(configResult.value);
        if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value.items || []);
        setReady(true);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ ...config, categories, ready }), [config, categories, ready]);

  return <StoreConfigContext.Provider value={value}>{children}</StoreConfigContext.Provider>;
}
