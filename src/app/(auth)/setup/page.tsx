import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SetupForm } from "@/components/auth/setup-form";
import { MIN_PASSWORD_LENGTH, userCount } from "@/lib/auth";

export const metadata: Metadata = { title: "Set up" };

// Only reachable while the app_user table is empty.
export default async function SetupPage() {
  if ((await userCount()) > 0) redirect("/login");

  return (
    <AuthShell tracedBorder>
      <SetupForm minLength={MIN_PASSWORD_LENGTH} />
    </AuthShell>
  );
}
