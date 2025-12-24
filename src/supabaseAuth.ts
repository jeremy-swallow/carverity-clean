import { supabase } from "./supabaseClient";

/**
 * Get the currently logged-in user.
 */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

/**
 * Sign in or sign up a user using magic-link email auth.
 * (No passwords — simple and safe)
 */
export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });

  if (error) throw error;
  return true;
}

/**
 * Sign the user out.
 */
export async function signOut() {
  await supabase.auth.signOut();
}
