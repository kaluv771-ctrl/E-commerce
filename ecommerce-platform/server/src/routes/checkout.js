import { Router } from "express";
import crypto from "node:crypto";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { initializePaystack, verifyPaystack } from "../utils/paystack.js";

const router = Router();

async function createPendingOrder(user, items, shipping_address) {
  if (!Array.isArray(items) || !items.length) throw new Error("Your cart is empty.");
  if (!shipping_address?.full_name || !shipping_address?.phone || !shipping_address?.address || !shipping_address?.city || !shipping_address?.state) {
    throw new Error("Complete all required delivery details.");
  }
  const ids = [...new Set(items.map(i => i.product_id))];
  if (ids.length !== items.length) throw new Error("Duplicate cart lines are not allowed.");
  const { data: products, error } = await supabaseAdmin.from("products")
    .select("id,name,price,stock_quantity,is_active").in("id", ids);
  if (error) throw error;
  if (products.length !== ids.length) throw new Error("One or more products are unavailable.");
  let totalKobo = 0;
  const orderLines = [];
  for (const item of items) {
    const product = products.find(p => p.id === item.product_id);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) throw new Error("Invalid product quantity.");
    if (!product.is_active || product.stock_quantity < quantity) throw new Error(`${product.name} does not have enough stock.`);
    const unitPriceKobo = Math.round(Number(product.price) * 100);
    totalKobo += unitPriceKobo * quantity;
    orderLines.push({ product_id: product.id, quantity, unit_price: Number(product.price) });
  }
  if (totalKobo < 10000) throw new Error("Order amount is below the payment provider minimum.");
  const reference = `OO-${crypto.randomUUID()}`;
  // Database function performs order creation and stock deduction atomically.
  const { data: orderId, error: rpcError } = await supabaseAdmin.rpc("create_order_and_reserve_stock", {
    p_user_id: user.id, p_order_number: reference, p_total_amount: totalKobo / 100,
    p_shipping_address: shipping_address, p_items: orderLines
  });
  if (rpcError) throw new Error(rpcError.message);
  return { orderId, reference, totalKobo };
}

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { orderId, reference, totalKobo } = await createPendingOrder(req.user, req.body.items, req.body.shipping_address);
    try {
      const payment = await initializePaystack({
        email: req.user.email, amountKobo: totalKobo, reference,
        metadata: { order_id: orderId, user_id: req.user.id }
      });
      await supabaseAdmin.from("payments").insert({
        order_id: orderId, payment_reference: reference, payment_provider: "paystack",
        amount: totalKobo / 100, payment_status: "pending"
      });
      res.status(201).json({ order_id: orderId, authorization_url: payment.authorization_url, reference });
    } catch (paymentError) {
      await supabaseAdmin.from("orders").update({ order_status: "Cancelled" }).eq("id", orderId);
      throw paymentError;
    }
  } catch (e) { res.status(400).json({ error: e.message || "Checkout failed." }); }
});

router.post("/verify", requireAuth, async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: "Payment reference is required." });
    const payment = await verifyPaystack(reference);
    const { data: order, error } = await supabaseAdmin.from("orders")
      .select("id,user_id,total_amount,payment_status").eq("order_number", reference).eq("user_id", req.user.id).single();
    if (error || !order) return res.status(404).json({ error: "Order not found." });
    if (payment.status !== "success" || Math.round(Number(order.total_amount) * 100) !== Number(payment.amount)) {
      return res.status(400).json({ error: "Payment could not be verified." });
    }
    await markPaid(reference, payment);
    res.json({ success: true, order_id: order.id });
  } catch (e) { res.status(400).json({ error: e.message || "Verification failed." }); }
});

export async function markPaid(reference, paymentData) {
  const { data: order } = await supabaseAdmin.from("orders").select("id,payment_status").eq("order_number", reference).single();
  if (!order || order.payment_status === "paid") return;
  await supabaseAdmin.from("orders").update({ payment_status: "paid", order_status: "Confirmed" }).eq("id", order.id);
  await supabaseAdmin.from("payments").update({ payment_status: "paid", gateway_response: paymentData }).eq("payment_reference", reference);
  await supabaseAdmin.from("order_tracking").insert({ order_id: order.id, status: "Confirmed", description: "Payment verified and order confirmed." });
}
export default router;
