import { supabaseAdmin } from "../config/supabase.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token || !supabaseAdmin) return res.status(401).json({ error: "Authentication required." });
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: "Invalid or expired session." });
    req.user = data.user;
    next();
  } catch { res.status(401).json({ error: "Unable to authenticate request." }); }
}

export async function requireAdmin(req, res, next) {
  const { data, error } = await supabaseAdmin.from("profiles").select("role").eq("id", req.user.id).single();
  if (error || data?.role !== "admin") return res.status(403).json({ error: "Administrator access required." });
  next();
}
