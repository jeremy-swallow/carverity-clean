// src/supabaseAuth.ts
import { supabase } from "./supabaseClient";

/**
 * Get the currently signed-in user (or null if not signed in)
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }

  return data.user ?? null;
}

/**
 * Sign the current user out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("signOut error:", error);
  }
}
