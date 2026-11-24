import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
const router = Router();
router.get("/dashboard", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [products, customers, orders, paid, recent] = await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("total_amount").eq("payment_status", "paid"),
      supabaseAdmin.from("orders").select("id,order_number,user_id,total_amount,payment_status,order_status,created_at,profiles(full_name)").order("created_at", { ascending: false }).limit(15)
    ]);
    for (const result of [products,customers,orders,paid,recent]) if (result.error) throw result.error;
    res.json({
      stats: {
        products: products.count || 0, customers: customers.count || 0, orders: orders.count || 0,
        revenue: (paid.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0)
      },
      orders: (recent.data || []).map(o => ({ ...o, customer_name: o.profiles?.full_name || null }))
    });
  } catch (e) { next(e); }
});
router.put("/orders/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["Confirmed","Processing","Shipped","Out for Delivery","Delivered","Cancelled"];
    if (!allowed.includes(req.body.order_status)) return res.status(400).json({ error: "Invalid status." });
    const { data, error } = await supabaseAdmin.from("orders").update({ order_status: req.body.order_status, updated_at: new Date().toISOString() }).eq("id", req.params.id).select().single();
    if (error) throw error;
    await supabaseAdmin.from("order_tracking").insert({ order_id: data.id, status: req.body.order_status, description: `Order status updated to ${req.body.order_status}.` });
    res.json({ order: data });
  } catch (e) { next(e); }
});
export default router;
