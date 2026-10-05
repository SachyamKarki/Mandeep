import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { MIN_PASSWORD_LENGTH, getCurrentUser, userCount } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  // Only used once, on a new install: the first account is the administrator.
  // After that, accounts are created by the administrator on the Users page.
  if ((await userCount()) > 0) redirect("/login");

  return (
    <AuthShell>
      <RegisterForm minLength={MIN_PASSWORD_LENGTH} />
    </AuthShell>
  );
}
