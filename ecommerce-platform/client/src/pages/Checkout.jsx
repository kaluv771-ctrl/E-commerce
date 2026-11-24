import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const money = value => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", city: "", state: "", country: "Nigeria" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setError("");
    if (!user) { navigate("/login", { state: { from: "/checkout" } }); return; }
    if (!items.length) { setError("Your cart is empty."); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/checkout", { items: items.map(i => ({ product_id: i.id, quantity: i.quantity })), shipping_address: form });
      if (data.authorization_url) window.location.assign(data.authorization_url);
      else if (data.order) { clear(); navigate(`/my-orders?created=${data.order.id}`); }
      else throw new Error("Checkout response was incomplete.");
    } catch (err) { setError(err.response?.data?.error || err.message || "Unable to start checkout."); }
    finally { setBusy(false); }
  };
  if (!items.length) return <section className="container page-section"><h1>Your bag is empty.</h1></section>;
  return <section className="container page-section"><div className="page-intro"><div className="eyebrow">ALMOST YOURS</div><h1>Check <em>out.</em></h1><p>Where should we send your order?</p></div>
    <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><h2>Delivery details</h2>
      {["full_name","phone","address","city","state","country"].map(field => <label key={field}>{field.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase())}<input required name={field} value={form[field]} onChange={change} placeholder={field === "country" ? "Nigeria" : ""}/></label>)}
      {error && <div className="notice error">{error}</div>}<button className="button button-dark wide" disabled={busy}>{busy ? "Preparing checkout..." : "Continue to payment"}</button><small>You'll be redirected to our secure payment provider.</small>
    </form><aside className="summary-card"><h3>Your order</h3>{items.map(i => <div key={i.id}><span>{i.name} × {i.quantity}</span><b>{money(i.price * i.quantity)}</b></div>)}<div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div></aside></div>
  </section>;
}
