import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

const money = value => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export default function ProductCard({ product }) {
  const { add } = useCart();
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image">
        <img src={product.image_url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"} alt={product.name} />
        {product.is_featured && <span className="tag">Editor's pick</span>}
      </Link>
      <div className="product-meta">
        <div><Link to={`/products/${product.id}`} className="product-name">{product.name}</Link><p>{product.category_name || "Everyday essentials"}</p></div>
        <strong>{money(product.price)}</strong>
      </div>
      <button className="add-button" disabled={product.stock_quantity < 1} onClick={() => add(product)}>
        <ShoppingBag size={16}/>{product.stock_quantity < 1 ? "Sold out" : "Add to bag"}
      </button>
    </article>
  );
}
