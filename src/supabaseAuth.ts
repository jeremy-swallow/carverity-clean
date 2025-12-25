// src/supabaseAuth.ts
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

/**
 * Get the currently logged-in Supabase user.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("getCurrentUser error:", error.message);
    return null;
  }

  return data.user ?? null;
}

/**
 * Sign the current user out.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("signOut error:", error.message);
    throw error;
  }
}

/**
 * Send a magic-link email using Supabase v2.
 *
 * The helper is still called signInWithMagicLink so the rest of your
 * code (OnlineReport.tsx etc.) does not need to change.
 */
export async function signInWithMagicLink(
  email: string,
  redirectTo: string
): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    console.error("Error sending magic link:", error.message);
    throw error;
  }
}

/**
 * Completes magic-link login AFTER the user clicks the email link
 * and safely restores the Supabase session (Supabase v2 compatible).
 *
 * Call this on the page you redirect to from the email (e.g. /my-scans)
 * if you want to explicitly handle the callback + expired links.
 */
export async function handleMagicLinkCallback(): Promise<User | null> {
  try {
    const url = window.location.href;

    // In supabase-js v2, exchangeCodeForSession accepts the full URL string
    // that contains the "code" + "type" parameters from the redirect.
    const { data, error } = await supabase.auth.exchangeCodeForSession(url);

    if (error) {
      console.error("Magic-link callback error:", error.message);
      throw error;
    }

    return data.session?.user ?? null;
  } catch (err) {
    console.error(
      "Unexpected magic-link callback failure:",
      (err as any)?.message || err
    );
    return null;
  }
}
