import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser, safeNext, userCount } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // A new install has no accounts yet: create the administrator first.
  if ((await userCount()) === 0) redirect("/register");
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell tracedBorder>
      <LoginForm next={next} />
    </AuthShell>
  );
}
