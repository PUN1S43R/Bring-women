import { useState, useEffect } from 'react';
import { 
  Menu, Search, Heart, ShoppingBag, X, ChevronRight, 
  Home, Grid, User, Package, Star, ArrowRight,
  Instagram, Youtube, Mail, Phone, MapPin, MessageCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { categoriesApi } from '../lib/api';

// Reusable elegant Logo component that matches the uploaded visual identity
export const BrandLogo = ({ light = false }: { light?: boolean }) => {
  return (
    <div className="flex flex-col items-start select-none font-serif">
      <div className="flex items-baseline leading-none">
        <span className={`text-2xl font-bold italic tracking-tight ${light ? 'text-white' : 'text-brand-pink'}`}>Being</span>
        <span className={`text-xl font-light tracking-widest lowercase ml-1 ${light ? 'text-brand-pink-light' : 'text-brand-brown'}`}>women</span>
        <span className={`text-xs ml-0.5 ${light ? 'text-brand-pink-light' : 'text-brand-pink'}`}>✿</span>
      </div>
      <span className={`text-[6.5px] tracking-[0.2em] uppercase font-sans -mt-0.5 ${light ? 'text-white/60' : 'text-neutral-500'}`}>
        shop smart • share smart • grow together
      </span>
    </div>
  );
};

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const { user, role } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await categoriesApi.getAll();
        if (data) setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-brand-pink/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 text-brand-brown hover:text-brand-pink transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <BrandLogo />
            </Link>

            {/* Desktop Categories */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link to="/products" className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-brand-pink transition-colors">Shop All</Link>
              <div className="group relative">
                <button className="text-xs font-bold uppercase tracking-widest text-neutral-700 hover:text-brand-pink transition-colors">Categories</button>
                <div className="absolute top-full left-0 w-52 bg-white border border-brand-pink/10 shadow-2xl rounded-xl py-2 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {categories.map(cat => (
                    <Link 
                      key={cat.id} 
                      to={`/products?category=${cat.id}`}
                      className="block px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:text-brand-pink hover:bg-brand-pink-light transition-all"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/products?tag=@599" className="text-xs font-bold uppercase tracking-widest text-brand-pink hover:text-brand-pink-hover transition-colors flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>@599 Store</span>
              </Link>
              <Link to="/products?tag=Premium" className="text-xs font-bold uppercase tracking-widest text-brand-brown hover:text-brand-brown-hover transition-colors">Premium</Link>
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-3">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-neutral-600 hover:text-brand-pink hover:bg-brand-pink-light rounded-full transition-all">
                <Search className="w-5 h-5" />
              </button>
              <Link to="/wishlist" className="p-2 text-neutral-600 hover:text-brand-pink hover:bg-brand-pink-light rounded-full transition-all">
                <Heart className="w-5 h-5" />
              </Link>
              <Link to="/account" className="p-2 text-neutral-600 hover:text-brand-pink hover:bg-brand-pink-light rounded-full transition-all">
                <User className="w-5 h-5" />
              </Link>
              <Link to="/cart" className="p-2 text-neutral-600 hover:text-brand-pink hover:bg-brand-pink-light rounded-full transition-all relative">
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-brand-pink text-white text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-md animate-bounce">
                    {cart.length}
                  </span>
                )}
              </Link>
              {role === 'admin' || role === 'superadmin' ? (
                <Link to="/admin" className="hidden lg:inline-flex text-[10px] font-extrabold bg-brand-pink text-white px-3 py-1.5 rounded-full shadow-sm hover:bg-brand-pink-hover transition-all">ADMIN</Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-brand-pink/10 overflow-hidden bg-brand-pink-light"
            >
              <div className="max-w-3xl mx-auto px-4 py-5">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for women's wear, sarees, dresses, jewelry..."
                    className="w-full bg-white border-2 border-brand-pink/20 rounded-xl px-5 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigate(`/products?q=${e.currentTarget.value}`);
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-[70] shadow-2xl overflow-y-auto border-r border-brand-pink/10 flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <BrandLogo />
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-brand-pink-light rounded-xl transition-all text-neutral-600 hover:text-brand-pink">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 px-3">Main Menu</p>
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-brand-pink-light transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-brand-pink-light flex items-center justify-center group-hover:bg-brand-pink text-brand-pink group-hover:text-white transition-all">
                      <Home className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-xs tracking-wider text-neutral-700 group-hover:text-brand-pink">Home</span>
                  </Link>
                  <Link to="/products" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-brand-pink-light transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-brand-pink-light flex items-center justify-center group-hover:bg-brand-pink text-brand-pink group-hover:text-white transition-all">
                      <Grid className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-xs tracking-wider text-neutral-700 group-hover:text-brand-pink">Shop All</span>
                  </Link>
                  <Link to="/products?tag=@599" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-brand-pink-light transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-brand-pink/10 text-brand-pink flex items-center justify-center group-hover:bg-brand-pink group-hover:text-white transition-all">
                      <Star className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-xs tracking-wider text-brand-pink">@599 Store</span>
                  </Link>
                  <Link to="/products?tag=Premium" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-brand-pink-light transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-brand-brown-light text-brand-brown flex items-center justify-center group-hover:bg-brand-brown group-hover:text-white transition-all">
                      <Package className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-xs tracking-wider text-brand-brown">Premium Fashion</span>
                  </Link>

                  <div className="pt-6 mt-4 border-t border-brand-pink/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 px-3">Categories</p>
                    <div className="grid grid-cols-1 gap-1">
                      {categories.map(cat => (
                        <Link 
                          key={cat.id} 
                          to={`/products?category=${cat.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-brand-pink-light transition-all group"
                        >
                          <span className="text-[11px] font-bold text-neutral-600 group-hover:text-brand-pink">{cat.name}</span>
                          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-pink group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-brand-pink/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 px-3">Account</p>
                    <Link to="/account" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-brand-pink-light transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-brand-pink-light flex items-center justify-center group-hover:bg-brand-pink text-brand-pink group-hover:text-white transition-all">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <span className="font-bold text-xs tracking-wider text-neutral-700 group-hover:text-brand-pink">Profile & Orders</span>
                    </Link>
                    <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-brand-pink-light transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-brand-pink-light flex items-center justify-center group-hover:bg-brand-pink text-brand-pink group-hover:text-white transition-all">
                        <Heart className="w-4.5 h-4.5" />
                      </div>
                      <span className="font-bold text-xs tracking-wider text-neutral-700 group-hover:text-brand-pink">Wishlist</span>
                    </Link>
                  </div>
                </div>
              </div>

              {role === 'admin' || role === 'superadmin' ? (
                <div className="p-6 border-t border-brand-pink/10">
                  <Link 
                    to="/admin" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center w-full py-3 bg-brand-brown text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand-pink transition-colors"
                  >
                    Go to Admin Panel
                  </Link>
                </div>
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const BottomNav = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (path: string, tag?: string) => {
    const params = new URLSearchParams(location.search);
    const currentTag = params.get('tag');
    
    if (tag) {
      return location.pathname === '/products' && currentTag === tag;
    }
    
    if (path === '/') {
      return (location.pathname === '/' || (location.pathname === '/products' && !currentTag)) && !location.pathname.startsWith('/account');
    }
    
    if (path === '/account/orders') {
      return location.pathname === '/account' && params.get('view') === 'orders';
    }

    if (path === '/account') {
      return location.pathname === '/account' && (!params.get('view') || params.get('view') === 'profile');
    }
    
    return location.pathname.startsWith(path);
  };

  return (
    <motion.div 
      animate={{ y: isVisible ? 0 : 100 }}
      className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-brand-pink/10 z-50 px-6 py-3 shadow-lg"
    >
      <div className="flex justify-between items-center text-neutral-600">
        <Link to="/" className={`flex flex-col items-center space-y-0.5 ${isActive('/') ? 'text-brand-pink font-bold' : ''}`}>
          <Home className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Shop</span>
        </Link>
        <Link to="/products?tag=@599" className={`flex flex-col items-center space-y-0.5 ${isActive('/products', '@599') ? 'text-brand-pink font-bold' : ''}`}>
          <Star className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">@599</span>
        </Link>
        <Link to="/products?tag=Premium" className={`flex flex-col items-center space-y-0.5 ${isActive('/products', 'Premium') ? 'text-brand-brown font-bold' : ''}`}>
          <Package className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Premium</span>
        </Link>
        <Link to="/account?view=orders" className={`flex flex-col items-center space-y-0.5 ${isActive('/account/orders') ? 'text-brand-pink font-bold' : ''}`}>
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Orders</span>
        </Link>
        <Link to="/account" className={`flex flex-col items-center space-y-0.5 ${isActive('/account') ? 'text-brand-pink font-bold' : ''}`}>
          <User className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Account</span>
        </Link>
      </div>
    </motion.div>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-[#1A110E] border-t border-brand-pink/10 pt-16 pb-24 lg:pb-16 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="mb-6">
              <BrandLogo light={true} />
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Premium women's fashion celebrating the elegance, power, and beauty of modern women. Designed for style, absolute comfort, and grace.
            </p>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-white font-serif">Quick Links</h4>
            <ul className="space-y-3.5 text-xs text-neutral-400">
              <li><Link to="/about" className="hover:text-brand-pink transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-brand-pink transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-brand-pink transition-colors">Privacy Policy</Link></li>
              <li><Link to="/shipping" className="hover:text-brand-pink transition-colors">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-brand-pink transition-colors">Return Policy</Link></li>
              <li><Link to="/terms" className="hover:text-brand-pink transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-white font-serif">Contact Info</h4>
            <ul className="space-y-3.5 text-xs text-neutral-400">
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-brand-pink" />
                <span>+91 93262 00617</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-brand-pink" />
                <span>support@beingwomen.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 mt-1 text-brand-pink flex-shrink-0" />
                <span>next to aqsa hotel near darul falah masjid mumbra thane</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-white font-serif">Follow Us</h4>
            <div className="flex space-x-3">
              <a href="https://www.instagram.com/aquiib45?igsh=ODA1bmgzNjM4cmxs" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-brand-pink hover:text-white transition-all text-neutral-300"><Instagram className="w-4.5 h-4.5" /></a>
              <a href="#" className="p-3 bg-white/5 rounded-xl hover:bg-brand-pink hover:text-white transition-all text-neutral-300"><Youtube className="w-4.5 h-4.5" /></a>
              <a href="#" className="p-3 bg-white/5 rounded-xl hover:bg-brand-pink hover:text-white transition-all text-neutral-300"><MessageCircle className="w-4.5 h-4.5" /></a>
              <a href="#" className="p-3 bg-white/5 rounded-xl hover:bg-brand-pink hover:text-white transition-all text-neutral-300"><Mail className="w-4.5 h-4.5" /></a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <p className="text-xs text-neutral-500">© 2026 Being Women. All rights reserved.</p>
          <div className="flex flex-col items-center space-y-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">
              Developed by <a href="https://techszdeveloper.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-pink transition-colors">TECHSZDEVELOPER</a>
            </p>
            <div className="flex space-x-3.5">
              <a href="https://www.instagram.com/aquiib45?igsh=ODA1bmgzNjM4cmxs" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-400 hover:bg-brand-pink hover:text-white hover:border-brand-pink transition-all">A</a>
              <a href="https://www.instagram.com/shadankhan_06?igsh=MTE5bWJtb2FmOTk3ag==" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-400 hover:bg-brand-pink hover:text-white hover:border-brand-pink transition-all">S</a>
              <a href="https://www.instagram.com/khanzeeshan__30?igsh=eDBoZGJmdnFnajl0" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-400 hover:bg-brand-pink hover:text-white hover:border-brand-pink transition-all">Z</a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a 
        href="https://wa.me/919326200617" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </footer>
  );
};;
