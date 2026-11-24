import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

const money = value => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function Cart() {
  const { items, update, remove, total } = useCart();
  const navigate = useNavigate();
  return <section className="container page-section">
    <div className="page-intro"><div className="eyebrow">YOUR SELECTION</div><h1>Your <em>bag.</em></h1><p>{items.length ? "A few good things, all in one place." : "Your bag is waiting for something good."}</p></div>
    {!items.length ? <div className="empty-cart"><p>Your shopping bag is currently empty.</p><Link className="button button-dark" to="/products">Explore the shop</Link></div> :
      <div className="cart-layout"><div className="cart-items">{items.map(item => <article className="cart-item" key={item.id}>
        <img src={item.image_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"} alt={item.name}/>
        <div className="cart-item-info"><Link to={`/products/${item.id}`}>{item.name}</Link><span>{money(item.price)}</span><div className="quantity-control"><button onClick={() => update(item.id, item.quantity - 1)}><Minus size={13}/></button><span>{item.quantity}</span><button onClick={() => update(item.id, item.quantity + 1)}><Plus size={13}/></button></div></div>
        <div className="cart-item-end"><b>{money(item.price * item.quantity)}</b><button className="remove-button" onClick={() => remove(item.id)} aria-label="Remove item"><Trash2 size={17}/></button></div>
      </article>)}</div>
      <aside className="summary-card"><h3>Order summary</h3><div><span>Subtotal</span><b>{money(total)}</b></div><div><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><button className="button button-dark wide" onClick={() => navigate("/checkout")}>Continue to checkout <ArrowRight size={17}/></button><p>Taxes and delivery details are confirmed before payment.</p></aside></div>}
  </section>;
}
