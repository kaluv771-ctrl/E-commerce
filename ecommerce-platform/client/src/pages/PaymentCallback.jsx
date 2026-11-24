import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Confirming your payment securely...");
  const { clear } = useCart();

  useEffect(() => {
    let active = true;
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) {
      setStatus("failed");
      setMessage("We couldn't find a payment reference. Check your orders or contact support.");
      return;
    }
    api.post("/checkout/verify", { reference })
      .then(() => {
        if (!active) return;
        clear();
        setStatus("success");
        setMessage("Your payment has been verified and your order is confirmed.");
      })
      .catch(err => {
        if (!active) return;
        setStatus("failed");
        setMessage(err.response?.data?.error || "We couldn't verify this payment yet. If your account was debited, please contact support with your payment reference.");
      });
    return () => { active = false; };
  }, [params, clear]);

  return <section className="auth-section">
    <div className="auth-card">
      <div className="eyebrow">PAYMENT UPDATE</div>
      <h1>{status === "success" ? "Thank you." : status === "failed" ? "Payment not confirmed." : "One moment..."}</h1>
      <p>{message}</p>
      {status === "checking" && <div className="loading">Verifying with payment provider...</div>}
      {status !== "checking" && <Link className="button button-dark wide" to="/my-orders">View your orders</Link>}
      {status === "failed" && <p className="muted-small">Keep your payment reference for any support enquiry.</p>}
    </div>
  </section>;
}
