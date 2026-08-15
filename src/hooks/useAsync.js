import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async fetcher and exposes the loading / error / data triple every
 * screen in this app renders against, so no page can show a blank void
 * while a request is in flight.
 *
 * Requests are aborted on unmount and superseded by later calls, so a slow
 * response can never overwrite fresher data.
 */
export function useAsync(fetcher, deps = [], { immediate = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const run = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher({ signal: controller.signal });
      if (mountedRef.current && requestId === requestIdRef.current) {
        setData(result);
        setError(null);
      }
      return result;
    } catch (err) {
      if (err.name === 'AbortError') return undefined;
      if (mountedRef.current && requestId === requestIdRef.current) setError(err);
      return undefined;
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) run();
  }, [run, immediate]);

  return { data, loading, error, refetch: run, setData };
}
