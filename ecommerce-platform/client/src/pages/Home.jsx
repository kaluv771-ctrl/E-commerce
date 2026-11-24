import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  useEffect(() => { api.get("/products?limit=4").then(r => setProducts(r.data.products || [])).catch(() => {}); }, []);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15}/> THE EVERYDAY EDIT</div>
          <h1>Good things.<br/><em>Better living.</em></h1>
          <p>Discover useful, beautiful things for the spaces you live in and the life you love.</p>
          <Link to="/products" className="button button-lime">Explore the collection <ArrowUpRight size={17}/></Link>
          <div className="hero-note"><span>01 — 03</span><span>Thoughtful finds for everyday life</span></div>
        </div>
        <div className="hero-art">
          <img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=1400" alt="Warm, minimal home interior"/>
          <div className="floating-note"><span>THE NEW COLLECTION</span><b>Make room<br/>for good.</b><Link to="/products">Shop now <ArrowRight size={14}/></Link></div>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading"><div><div className="eyebrow">A FEW GOOD THINGS</div><h2>Made for your everyday.</h2></div><Link className="text-link" to="/products">View all products <ArrowUpRight size={16}/></Link></div>
        {products.length ? <div className="product-grid">{products.slice(0,4).map(p => <ProductCard key={p.id} product={p}/>)}</div> :
          <div className="empty-products"><p>Our shelves are being thoughtfully stocked.</p><Link to="/products" className="text-link">Explore the shop <ArrowRight size={16}/></Link></div>}
      </section>
      <section className="values-band"><div className="container values-grid"><div><span>01</span><b>Thoughtfully chosen</b><p>Useful things with a little extra care.</p></div><div><span>02</span><b>Made to be loved</b><p>Everyday quality, without the fuss.</p></div><div><span>03</span><b>Easy from start to finish</b><p>A simple, considered shopping experience.</p></div></div></section>
    </>
  );
}
