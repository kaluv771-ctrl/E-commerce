import { Router } from "express";
import crypto from "node:crypto";
import { supabaseAdmin } from "../config/supabase.js";
import { markPaid } from "./checkout.js";
import { verifyPaystack } from "../utils/paystack.js";

const router = Router();

router.post("/paystack/webhook", async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const secret = process.env.PAYSTACK_SECRET_KEY || "";
  const expected = crypto.createHmac("sha512", secret).update(req.rawBody || Buffer.from(JSON.stringify(req.body))).digest("hex");
  if (!signature) return res.sendStatus(401);
  const signatureBuffer = Buffer.from(String(signature));
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return res.sendStatus(401);
  const event = req.body;
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      const verified = await verifyPaystack(event.data.reference);
      if (verified.status === "success") {
        const { data: order } = await supabaseAdmin.from("orders").select("total_amount").eq("order_number", event.data.reference).single();
        if (order && Math.round(Number(order.total_amount) * 100) === Number(verified.amount)) await markPaid(event.data.reference, verified);
      }
    } catch (e) { console.error("Paystack webhook processing error:", e.message); }
  }
  res.sendStatus(200);
});
export default router;
