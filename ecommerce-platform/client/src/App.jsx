import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import Admin from "./pages/Admin";
import PaymentCallback from "./pages/PaymentCallback";
import { useAuth } from "./context/AuthContext";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace/>;
}

export default function App() {
  return <Layout><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/products" element={<Products/>}/>
    <Route path="/products/:id" element={<ProductDetail/>}/>
    <Route path="/cart" element={<Cart/>}/>
    <Route path="/checkout" element={<Checkout/>}/>
    <Route path="/payment/callback" element={<PaymentCallback/>}/>
    <Route path="/login" element={<Auth/>}/>
    <Route path="/register" element={<Auth mode="register"/>}/>
    <Route path="/my-orders" element={<Orders/>}/>
    <Route path="/admin" element={<Protected><Admin/></Protected>}/>
    <Route path="*" element={<Navigate to="/"/>}/>
  </Routes></Layout>;
}
