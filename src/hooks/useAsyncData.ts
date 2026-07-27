import { useCallback, useEffect, useRef, useState } from 'react';

type AsyncDataState<T> = {
  data: T | null;
  /** True until the first result (or error) arrives for this hook instance. */
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const toError = (caught: unknown): Error =>
  caught instanceof Error ? caught : new Error('Unable to load content.');

/**
 * Runs `loader` on mount and whenever its identity changes, keeping the previous result
 * on screen while a new one is in flight. `refreshing` is tracked separately so
 * pull-to-refresh does not blank the screen.
 *
 * Callers must memoize `loader` (with `useCallback`) — its identity is the dependency.
 */
export const useAsyncData = <T,>(loader: () => Promise<T>): AsyncDataState<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [settled, setSettled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loader()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(toError(caught));
      })
      .finally(() => {
        if (!cancelled) setSettled(true);
      });

    return () => {
      cancelled = true;
    };
  }, [loader]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await loader();
      if (!mounted.current) return;
      setData(result);
      setError(null);
    } catch (caught) {
      if (mounted.current) setError(toError(caught));
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [loader]);

  return { data, loading: !settled, refreshing, error, refresh };
};
