import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const money = value => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const statuses = ["Confirmed","Processing","Shipped","Out for Delivery","Delivered","Cancelled"];

export default function Admin() {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { api.get("/admin/dashboard").then(r => setData(r.data)).catch(e => setError(e.response?.data?.error || "Unable to load admin dashboard.")).catch(() => {}); }, [refresh]);
  const updateStatus = async (id, order_status) => {
    try { await api.put(`/admin/orders/${id}/status`, { order_status }); setRefresh(x => x + 1); }
    catch (e) { setError(e.response?.data?.error || "Could not update order."); }
  };
  if (profile?.role !== "admin") return <section className="container page-section"><h1>Admin access required</h1><p>This area is restricted to authorized administrators.</p></section>;
  return <section className="container page-section"><div className="page-intro"><div className="eyebrow">STORE MANAGEMENT</div><h1>Good morning, <em>admin.</em></h1><p>A clear view of what's happening in your store.</p></div>
    {error && <div className="notice error">{error}</div>}
    {data && <><div className="stats-grid">{[["Products",data.stats.products],["Customers",data.stats.customers],["Orders",data.stats.orders],["Revenue",money(data.stats.revenue)]].map(([label,value]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="admin-panel"><h2>Recent orders</h2><div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Update</th></tr></thead><tbody>{data.orders.map(o => <tr key={o.id}><td>{o.order_number}</td><td>{o.customer_name || o.user_id}</td><td>{money(o.total_amount)}</td><td>{o.payment_status}</td><td>{o.order_status}</td><td><select value={o.order_status} onChange={e => updateStatus(o.id,e.target.value)}>{[o.order_status,...statuses.filter(s => s !== o.order_status)].map(s => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div></div>
    </>}
  </section>;
}
