import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Navbar, BottomNav, Footer } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load pages
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const ProductList = lazy(() => import('./pages/ProductList').then(m => ({ default: m.ProductList })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Account = lazy(() => import('./pages/Account').then(m => ({ default: m.Account })));
const AdminPanel = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminPanel })));
const Wishlist = lazy(() => import('./pages/Wishlist').then(m => ({ default: m.Wishlist })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const About = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.About })));
const Privacy = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Privacy })));
const Shipping = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Shipping })));
const Returns = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Returns })));
const Terms = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Terms })));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const OrderFailed = lazy(() => import('./pages/OrderFailed').then(m => ({ default: m.OrderFailed })));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Router>
            <div className="min-h-screen bg-white font-sans selection:bg-black selection:text-white overflow-x-hidden">
              <Navbar />
              <main className="min-h-[calc(100vh-400px)]">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                    <Route path="/order-failed/:orderId?" element={<OrderFailed />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/account/:tab" element={<Account />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/shipping" element={<Shipping />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/terms" element={<Terms />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <BottomNav />
              <Toaster position="top-center" />
            </div>
          </Router>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
