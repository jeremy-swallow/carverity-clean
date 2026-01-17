// src/supabaseAuth.ts
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

const CANONICAL_APP_ORIGIN = "https://carverity.com.au";

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
 */
export async function signInWithMagicLink(
  email: string,
  redirectTo?: string
): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || `${CANONICAL_APP_ORIGIN}/my-scans`,
    },
  });

  if (error) {
    console.error("Error sending magic link:", error.message);
    throw error;
  }
}

/**
 * Password sign-in (Email + Password).
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error signing in with password:", error.message);
    throw error;
  }
}

/**
 * Create an account with Email + Password.
 * (Useful as fallback when magic links fail.)
 */
export async function signUpWithPassword(
  email: string,
  password: string
): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${CANONICAL_APP_ORIGIN}/my-scans`,
    },
  });

  if (error) {
    console.error("Error signing up with password:", error.message);
    throw error;
  }
}

/**
 * Start Google OAuth sign-in.
 * Requires provider enabled in Supabase dashboard.
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${CANONICAL_APP_ORIGIN}/my-scans`,
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error.message);
    throw error;
  }
}

/**
 * Completes magic-link login AFTER the user clicks the email link
 * and safely restores the Supabase session.
 */
export async function handleMagicLinkCallback(): Promise<User | null> {
  try {
    const url = window.location.href;

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
