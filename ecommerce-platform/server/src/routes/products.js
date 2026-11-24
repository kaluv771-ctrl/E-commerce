import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { search = "", category = "", sort = "newest", limit = "100" } = req.query;
    let query = supabaseAdmin.from("products")
      .select("id,name,description,price,category_id,image_url,stock_quantity,is_featured,created_at,categories(name)")
      .eq("is_active", true).limit(Math.min(Number(limit) || 100, 100));
    if (search) query = query.ilike("name", `%${String(search).slice(0,80)}%`);
    if (category) query = query.eq("category_id", category);
    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    res.json({ products: (data || []).map(p => ({ ...p, category_name: p.categories?.name || null, categories: undefined })) });
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("products")
      .select("*,categories(name)").eq("id", req.params.id).eq("is_active", true).single();
    if (error) return res.status(404).json({ error: "Product not found." });
    res.json({ product: { ...data, category_name: data.categories?.name || null } });
  } catch (e) { next(e); }
});

router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, price, category_id, image_url, stock_quantity, is_featured } = req.body;
    if (!name || !Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ error: "Valid product name and price are required." });
    const { data, error } = await supabaseAdmin.from("products").insert({
      name, description, price: Number(price), category_id: category_id || null,
      image_url: image_url || null, stock_quantity: Math.max(0, Number(stock_quantity) || 0),
      is_featured: !!is_featured
    }).select().single();
    if (error) throw error;
    res.status(201).json({ product: data });
  } catch (e) { next(e); }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["name","description","price","category_id","image_url","stock_quantity","is_featured","is_active"];
    const payload = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabaseAdmin.from("products").update(payload).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ product: data });
  } catch (e) { next(e); }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin.from("products").update({ is_active: false }).eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
