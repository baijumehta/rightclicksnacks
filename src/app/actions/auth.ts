"use server";

import { redirect } from "next/navigation";
import { beginSignIn, endSession } from "@/lib/auth.ts";

export async function signIn(formData: FormData): Promise<void> {
  const raw = formData.get("redirectTo");
  // Only ever bounce back inside this app; an absolute URL here would make a
  // tidy open-redirect out of the sign-in link.
  const redirectTo =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  redirect(await beginSignIn(redirectTo));
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/login");
}
