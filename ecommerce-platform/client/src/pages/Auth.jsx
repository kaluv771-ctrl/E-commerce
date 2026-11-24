import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Auth({ mode = "login" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const signup = mode === "register";
  const submit = async e => {
    e.preventDefault(); setError(""); setMessage(""); setBusy(true);
    if (!supabase) { setError("Add your Supabase URL and anon key to client/.env first."); setBusy(false); return; }
    try {
      if (signup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name } }
        });
        if (authError) throw authError;
        if (data.session) navigate("/");
        else setMessage("Account created. Check your email to verify your address, then sign in.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        navigate(location.state?.from || "/");
      }
    } catch (err) { setError(err.message || "Authentication failed."); }
    finally { setBusy(false); }
  };
  return <section className="auth-section"><form className="auth-card" onSubmit={submit}>
    <div className="eyebrow">{signup ? "JOIN THE COMMUNITY" : "WELCOME BACK"}</div><h1>{signup ? "Create an account." : "Good to see you."}</h1><p>{signup ? "A better shopping experience starts here." : "Sign in to continue to your account."}</p>
    {signup && <label>Full name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name"/></label>}
    <label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>
    <label>Password<input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
    {error && <div className="notice error">{error}</div>}{message && <div className="notice success">{message}</div>}
    <button className="button button-dark wide" disabled={busy}>{busy ? "Please wait..." : signup ? "Create account" : "Sign in"}</button>
    {!signup && <button type="button" className="subtle-button" onClick={async () => {
      if (!supabase || !email) { setError("Enter your email address first."); return; }
      const { error: e } = await supabase.auth.resetPasswordForEmail(email);
      if (e) setError(e.message); else setMessage("Password reset instructions have been sent if the account exists.");
    }}>Forgot password?</button>}
    <div className="auth-switch">{signup ? "Already have an account?" : "New to Olive & Oak?"} <Link to={signup ? "/login" : "/register"}>{signup ? "Sign in" : "Create an account"}</Link></div>
  </form></section>;
}
