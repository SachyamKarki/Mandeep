import type { ReactNode } from "react";
import { logout } from "@/actions/auth";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";

// Every page in this group needs a signed-in user.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={user} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
