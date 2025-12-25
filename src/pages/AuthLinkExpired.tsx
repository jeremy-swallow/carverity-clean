import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AuthLinkExpired() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";

  async function resendLink() {
    if (!email) return;

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/my-scans`,
      },
    });

    alert("A new sign-in link has been sent.");
  }

  return (
    <div className="container" style={{ maxWidth: 600, margin: "3rem auto" }}>
      <h1>Sign-in link expired</h1>

      <p>
        The email sign-in link has already been used or has expired.  
        Magic links are single-use and device-specific.
      </p>

      {email ? (
        <>
          <p>
            Click below to send a new link to <strong>{email}</strong>.
          </p>
          <button onClick={resendLink} className="btn-primary">
            Resend sign-in link
          </button>
        </>
      ) : (
        <>
          <p>Please restart your action and request a new email.</p>
        </>
      )}

      <div style={{ marginTop: "2rem" }}>
        <button onClick={() => navigate("/")} className="btn-secondary">
          Return to home
        </button>
      </div>
    </div>
  );
}
