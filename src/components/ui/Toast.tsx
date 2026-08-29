'use client';

import * as React from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

// Simple module-level pub/sub so `toast()` can be called from anywhere.
type Listener = (t: ToastItem) => void;
const listeners = new Set<Listener>();
let counter = 0;

export function toast(message: string, type: ToastType = 'success') {
  const item: ToastItem = { id: ++counter, type, message };
  listeners.forEach((l) => l(item));
}

toast.success = (m: string) => toast(m, 'success');
toast.error = (m: string) => toast(m, 'error');
toast.info = (m: string) => toast(m, 'info');

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const listener: Listener = (item) => {
      setItems((prev) => [...prev, item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, 4000);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const dismiss = (id: number) =>
    setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-soft animate-fade-in',
            t.type === 'error' ? 'border-red-200' : 'border-ink-200',
          )}
        >
          {icons[t.type]}
          <p className="flex-1 text-sm text-ink-800">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-ink-400 hover:text-ink-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
