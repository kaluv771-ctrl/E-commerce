import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
const router = Router();
router.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("categories").select("id,name,description").order("name");
    if (error) throw error;
    res.json({ categories: data || [] });
  } catch (e) { next(e); }
});
export default router;
