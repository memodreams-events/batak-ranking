import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

interface Toast {
  text: string;
  error: boolean;
}

interface ToastContextValue {
  current: Toast | null;
  show: (text: string, error?: boolean) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, error = false) => {
    setCurrent({ text, error });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCurrent(null), 3200);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const value = useMemo(() => ({ current, show }), [current, show]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast fuera de <ToastProvider>');
  return context;
}
