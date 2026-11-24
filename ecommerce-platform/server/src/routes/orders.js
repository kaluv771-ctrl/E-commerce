import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("orders")
      .select("id,order_number,total_amount,payment_status,order_status,created_at,order_items(id,quantity,unit_price,products(name,image_url))")
      .eq("user_id", req.user.id).order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (e) { next(e); }
});

router.get("/:id/tracking", requireAuth, async (req, res, next) => {
  try {
    const { data: order, error } = await supabaseAdmin.from("orders").select("id,user_id,order_number,order_status").eq("id", req.params.id).single();
    if (error || (order.user_id !== req.user.id)) return res.status(404).json({ error: "Order not found." });
    const { data, error: trackError } = await supabaseAdmin.from("order_tracking").select("*").eq("order_id", order.id).order("updated_at");
    if (trackError) throw trackError;
    res.json({ order, tracking: data || [] });
  } catch (e) { next(e); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("orders")
      .select("*,order_items(*,products(name,image_url))").eq("id", req.params.id).eq("user_id", req.user.id).single();
    if (error) return res.status(404).json({ error: "Order not found." });
    res.json({ order: data });
  } catch (e) { next(e); }
});

router.get("/admin/list", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("orders").select("*,profiles(full_name)").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (e) { next(e); }
});

router.put("/admin/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["Confirmed","Processing","Shipped","Out for Delivery","Delivered","Cancelled"];
    const { order_status } = req.body;
    if (!allowed.includes(order_status)) return res.status(400).json({ error: "Invalid order status." });
    const { data, error } = await supabaseAdmin.from("orders").update({ order_status, updated_at: new Date().toISOString() }).eq("id", req.params.id).select().single();
    if (error) throw error;
    await supabaseAdmin.from("order_tracking").insert({ order_id: data.id, status: order_status, description: `Order status updated to ${order_status}.` });
    res.json({ order: data });
  } catch (e) { next(e); }
});

export default router;
