import { useState, useEffect, useCallback, useRef } from "react";

export const useFetch = (fetchFn, deps = [], interval = null) => {
  const [data, setData] = [useState(null)[0], useState(null)[1]];
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const fn = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const r = await fetchFn();
      setState({ data: r.data, loading: false, error: null });
    } catch (e) {
      setState({
        data: null,
        loading: false,
        error: e.response?.data?.error || e.message,
      });
    }
  }, deps);
  useEffect(() => {
    fn();
  }, [fn]);
  useEffect(() => {
    if (!interval) return;
    const id = setInterval(fn, interval);
    return () => clearInterval(id);
  }, [fn, interval]);
  return { ...state, refetch: fn };
};

export const useInterval = (cb, delay) => {
  const saved = useRef(cb);
  useEffect(() => {
    saved.current = cb;
  });
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
};

export const useClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
};

export const useDebounce = (value, delay = 400) => {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setD(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return d;
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, color = "var(--cyan)", duration = 3500) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, color }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
  }, []);
  return {
    toasts,
    show,
    danger: (m) => show(m, "var(--red)"),
    warning: (m) => show(m, "var(--orange)"),
    success: (m) => show(m, "var(--cyan)"),
  };
};
