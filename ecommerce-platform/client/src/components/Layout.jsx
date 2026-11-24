import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Menu, X, Leaf, UserRound, LogOut } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { user, signOut, profile } = useAuth();
  const nav = [
    ["Shop", "/products"],
    ["Track order", "/my-orders"],
    ...(profile?.role === "admin" ? [["Admin", "/admin"]] : [])
  ];
  return (
    <div className="min-h-screen flex flex-col">
      <div className="announcement">A little more thoughtful. A little more you. <span>Free delivery on orders over ₦75,000</span></div>
      <header className="site-header">
        <div className="container nav-wrap">
          <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
          <Link to="/" className="brand"><span className="brand-mark"><Leaf size={19}/></span><span>olive <b>& oak</b></span></Link>
          <nav className={open ? "nav-links open" : "nav-links"}>
            {nav.map(([label, href]) => <NavLink key={href} to={href} onClick={() => setOpen(false)}>{label}</NavLink>)}
          </nav>
          <div className="nav-actions">
            {user ? <button className="icon-link" onClick={signOut} title="Sign out"><LogOut size={19}/></button> : <Link className="icon-link" to="/login" title="Account"><UserRound size={19}/></Link>}
            <Link className="cart-link" to="/cart"><ShoppingBag size={19}/><span>Bag</span><i>{count}</i></Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="footer">
        <div className="container footer-inner">
          <div><Link to="/" className="brand footer-brand"><span className="brand-mark"><Leaf size={19}/></span><span>olive <b>& oak</b></span></Link><p>Everyday finds, thoughtfully chosen.</p></div>
          <div className="footer-links"><Link to="/products">Shop all</Link><Link to="/my-orders">Your orders</Link><a href="mailto:hello@example.com">Contact</a></div>
          <small>© {new Date().getFullYear()} Olive & Oak. Built for better everyday.</small>
        </div>
      </footer>
    </div>
  );
}
