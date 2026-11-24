import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/categories").then(r => setCategories(r.data.categories || [])).catch(() => {}); }, []);
  useEffect(() => {
    setLoading(true); setError("");
    api.get("/products", { params: { search, category, sort } })
      .then(r => setProducts(r.data.products || []))
      .catch(() => setError("Products could not be loaded. Check your API and database configuration."))
      .finally(() => setLoading(false));
  }, [search, category, sort]);
  return <section className="container page-section">
    <div className="page-intro"><div className="eyebrow">THE COLLECTION</div><h1>Find your <em>everyday.</em></h1><p>Good design, useful details, and things worth keeping.</p></div>
    <div className="toolbar">
      <label className="search-box"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."/></label>
      <label className="select-box"><SlidersHorizontal size={17}/><select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
    </div>
    {loading ? <div className="loading">Finding good things...</div> : error ? <div className="notice error">{error}</div> : products.length ? <div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="empty-products">No products match your search just yet.</div>}
  </section>;
}
