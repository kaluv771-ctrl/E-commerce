import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

const money = value => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const { add } = useCart();
  useEffect(() => { api.get(`/products/${id}`).then(r => setProduct(r.data.product)).catch(() => setError("We couldn't find that product.")); }, [id]);
  if (error) return <div className="container page-section"><p>{error}</p><Link to="/products" className="text-link">Back to shop</Link></div>;
  if (!product) return <div className="container loading">Loading product...</div>;
  return <section className="container detail-layout">
    <div className="detail-image"><img src={product.image_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000"} alt={product.name}/></div>
    <div className="detail-copy"><Link to="/products" className="back-link"><ArrowLeft size={16}/> Back to shop</Link><div className="eyebrow">{product.category_name || "THE COLLECTION"}</div><h1>{product.name}</h1><div className="detail-price">{money(product.price)}</div><p>{product.description || "A thoughtful addition to your everyday."}</p><div className="stock-line">{product.stock_quantity > 0 ? `${product.stock_quantity} available` : "Currently unavailable"}</div>
      <div className="quantity-row"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}>+</button></div>
      <button className="button button-dark wide" disabled={product.stock_quantity < 1} onClick={() => add(product, qty)}><ShoppingBag size={17}/> Add to bag</button>
    </div>
  </section>;
}
