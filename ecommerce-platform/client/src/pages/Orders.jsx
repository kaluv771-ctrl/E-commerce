import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageCheck, Clock3 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const money = value => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const steps = ["Pending","Confirmed","Processing","Shipped","Out for Delivery","Delivered"];

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get("/orders").then(r => setOrders(r.data.orders || [])).catch(e => setError(e.response?.data?.error || "Could not load your orders.")).finally(() => setLoading(false));
  }, [user]);
  if (!user) return <section className="container page-section"><h1>Your orders</h1><p>Sign in to view and track your orders.</p><Link className="button button-dark" to="/login">Sign in</Link></section>;
  return <section className="container page-section"><div className="page-intro"><div className="eyebrow">AFTER THE CHECKOUT</div><h1>Your <em>orders.</em></h1><p>Everything you've ordered, all in one place.</p></div>
    {loading ? <div className="loading">Loading your orders...</div> : error ? <div className="notice error">{error}</div> : !orders.length ? <div className="empty-cart"><PackageCheck size={36}/><p>No orders yet. Your next favourite thing is waiting.</p><Link className="button button-dark" to="/products">Start shopping</Link></div> :
      <div className="orders-list">{orders.map(order => { const active = steps.indexOf(order.order_status); return <article className="order-card" key={order.id}>
        <div className="order-top"><div><span>ORDER {order.order_number}</span><h3>{new Date(order.created_at).toLocaleDateString()}</h3></div><div className="order-amount">{money(order.total_amount)}</div></div>
        <div className="order-status"><span className={`status-pill ${order.payment_status === "paid" ? "paid" : ""}`}>{order.payment_status}</span><span className="status-pill">{order.order_status}</span></div>
        <div className="tracking-steps">{steps.filter(s => s !== "Cancelled").map((step, i) => <div key={step} className={active >= i ? "tracking-step done" : "tracking-step"}><i>{active >= i ? "✓" : <Clock3 size={12}/>}</i><span>{step}</span></div>)}</div>
      </article>; })}
    </div>}
  </section>;
}
