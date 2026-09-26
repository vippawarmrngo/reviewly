import { type ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";

interface ToastItem {
  id: number;
  text: string;
  kind: "ok" | "error";
}

const ToastContext = createContext<(text: string, kind?: "ok" | "error") => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

const LIFETIME_MS = 3200;

/** Brief confirmations that do not move the page. Announced politely to screen readers; each disappears on its own. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const push = useCallback((text: string, kind: "ok" | "error" = "ok") => {
    const id = next.current++;
    setItems((cur) => [...cur.slice(-2), { id, text, kind }]); // never more than three at once
    window.setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), LIFETIME_MS);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <Icon name={t.kind === "ok" ? "check-circle" : "x-circle"} size={15} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
