import "server-only";
import { cookies } from "next/headers";

/**
 * Leaves a one-time message for the next page, for server actions that redirect
 * (the action's return value never reaches the form). <Toaster /> reads and clears it.
 */
export async function flash(message: string, tone: "success" | "error" = "success") {
  // Next.js URL-encodes cookie values itself.
  (await cookies()).set("flash", JSON.stringify({ message, tone }), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
    httpOnly: false, // the toaster reads it in the browser
  });
}
