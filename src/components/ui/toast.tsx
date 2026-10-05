"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error";
type Toast = { id: number; message: string; tone: Tone };

const EVENT = "app-toast";
const FLASH_COOKIE = "flash";

/** Show a toast from any client component. */
export function toast(message: string, tone: Tone = "success") {
  window.dispatchEvent(new CustomEvent<Omit<Toast, "id">>(EVENT, { detail: { message, tone } }));
}

/** Reads (and clears) a message a server action left before redirecting. */
function takeFlash(): Omit<Toast, "id"> | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${FLASH_COOKIE}=([^;]*)`));
  if (!match) return null;
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    console.warn("Could not read flash message", match[1]);
    return null;
  }
}

let nextId = 1;

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const add = (t: Omit<Toast, "id">) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), t.tone === "error" ? 6000 : 3500);
    };
    const onToast = (e: Event) => add((e as CustomEvent<Omit<Toast, "id">>).detail);
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  // After every navigation, show any message a redirecting action left behind.
  useEffect(() => {
    const flash = takeFlash();
    if (flash) toast(flash.message, flash.tone);
  }, [pathname]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={cn(
            "toast-in pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-md border px-4 py-3 text-sm font-medium shadow-[0_10px_30px_rgba(15,23,42,0.15)]",
            t.tone === "error" ? "border-danger-border bg-danger-soft text-danger" : "border-ok/30 bg-ok-soft text-ok",
          )}
        >
          {t.tone === "error" ? (
            <AlertCircle size={18} className="mt-px shrink-0 text-danger" />
          ) : (
            <CheckCircle2 size={18} className="mt-px shrink-0 text-ok-fill" />
          )}
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            className="-m-1 cursor-pointer rounded-sm p-1 opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
