const PAYSTACK_BASE = "https://api.paystack.co";

export async function initializePaystack({ email, amountKobo, reference, metadata }) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Payment gateway is not configured.");
  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email, amount: amountKobo, reference, metadata, currency: "NGN",
      callback_url: `${(process.env.CLIENT_URL || "http://localhost:5173").split(",")[0]}/payment/callback`
    })
  });
  const result = await response.json();
  if (!response.ok || !result.status) throw new Error(result.message || "Unable to initialize payment.");
  return result.data;
}

export async function verifyPaystack(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Payment gateway is not configured.");
  const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` }
  });
  const result = await response.json();
  if (!response.ok || !result.status) throw new Error(result.message || "Unable to verify payment.");
  return result.data;
}
