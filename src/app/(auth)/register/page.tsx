import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { MIN_PASSWORD_LENGTH, getCurrentUser, userCount } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage() {
  // The very first account is made on /setup, as an admin.
  if ((await userCount()) === 0) redirect("/setup");
  if (await getCurrentUser()) redirect("/");

  return (
    <AuthShell>
      <RegisterForm minLength={MIN_PASSWORD_LENGTH} />
    </AuthShell>
  );
}
