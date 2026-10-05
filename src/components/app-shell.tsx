"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Building2,
  Database,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  UserCog,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

const SIDEBAR_COLLAPSED_KEY = "sidebar_collapsed";
const COLLAPSED_EVENT = "sidebar-collapsed-change";

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribeCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COLLAPSED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Claims", href: "/claims", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Directory", href: "/directory", icon: Building2 },
  { label: "Audit Trail", href: "/audit", icon: History },
  { label: "SQL Showcase", href: "/sql", icon: Database },
];

function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className={cn("text-base font-bold tracking-tight", dark ? "text-white" : "text-ink")}>Mangaldeep</span>
      <span className={cn("text-sm font-light", dark ? "text-white/70" : "text-muted")}>Claims</span>
    </span>
  );
}

export function AppShell({
  children,
  user,
  logoutAction,
}: {
  children: ReactNode;
  user: SessionUser;
  logoutAction: () => Promise<void>;
}) {
  const items = user.role === "admin" ? [...navItems, { label: "Users", href: "/users", icon: UserCog }] : navItems;
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapsed() {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!collapsed));
    } catch {
      // storage unavailable
    }
    window.dispatchEvent(new Event(COLLAPSED_EVENT));
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas md:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex size-9 items-center justify-center rounded-sm border border-border text-ink hover:bg-subtle"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
        <Wordmark />
        <span className="size-9" />
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-60 max-w-[85vw] flex-col overflow-hidden bg-sidebar text-white transition-all duration-300 ease-in-out",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-60",
        )}
      >
        <div
          className={cn(
            "flex min-h-14 items-center border-b border-white/10 px-3",
            collapsed ? "justify-between md:justify-center md:px-0" : "justify-between",
          )}
        >
          <Link href="/" className={cn("pl-2", collapsed && "md:hidden")} onClick={() => setMobileOpen(false)}>
            <Wordmark dark />
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden rounded-sm p-2 text-white hover:bg-white/10 md:flex"
          >
            <Menu size={16} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex rounded-sm p-2 text-white hover:bg-white/10 md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {items.map(({ label, href, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex h-10 items-center gap-3 overflow-hidden whitespace-nowrap border-l-4 px-3 text-sm transition-all duration-200",
                  collapsed && "md:justify-center md:px-0",
                  active
                    ? "rounded-r-sm border-l-white bg-white/[0.08] font-semibold text-white"
                    : "rounded-sm border-l-transparent font-medium text-white/85 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <Icon size={18} className="shrink-0" strokeWidth={1.8} />
                <span className={cn(collapsed && "md:hidden")}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-white/10 p-2 pb-6">
          <Link
            href="/account"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? `${user.full_name} · My account` : undefined}
            className={cn(
              "flex items-center gap-3 rounded-sm px-2 py-2 hover:bg-white/[0.06]",
              collapsed && "md:justify-center md:px-0",
              pathname.startsWith("/account") && "bg-white/[0.08]",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
              {user.full_name
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <span className={cn("min-w-0", collapsed && "md:hidden")}>
              <span className="block truncate text-xs font-semibold">{user.full_name}</span>
              <span className="block truncate text-xs text-white/60 capitalize">{user.role}</span>
            </span>
            <UserRound size={14} className={cn("ml-auto shrink-0 text-white/50", collapsed && "md:hidden")} />
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              className={cn(
                "flex h-9 w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white",
                collapsed && "md:justify-center md:px-0",
              )}
            >
              <LogOut size={15} className="shrink-0" />
              <span className={cn(collapsed && "md:hidden")}>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out",
          collapsed ? "md:ml-16" : "md:ml-60",
        )}
      >
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-1 px-4 py-4 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
            <p>Mangaldeep Consulting Pvt. Ltd. · Claim Survey Management Database</p>
            <p>DATA 210 · Shaksham Karki, Bikram Timalsina, Rosis KC</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
