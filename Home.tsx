import React, { useState, useEffect } from 'react';
import { slidersApi, categoriesApi, productsApi, wishlistApi } from '../lib/api';
import { ChevronLeft, ChevronRight, Star, Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export const Home = () => {
// ...
// (keeping Home as is, just updating imports)
  const [sliders, setSliders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [under599Products, setUnder599Products] = useState<any[]>([]);
  const [currentSlider, setCurrentSlider] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, cRes, nRes, uRes] = await Promise.all([
          slidersApi.getAll(),
          categoriesApi.getAll(),
          productsApi.getAll({ is_new_arrival: 'true', limit: 8 }),
          productsApi.getAll({ is_under_599: 'true', limit: 8 })
        ]);
        
        if (sRes.data) setSliders(sRes.data);
        if (cRes.data) setCategories(cRes.data);
        if (nRes.data) setNewArrivals(nRes.data);
        if (uRes.data) setUnder599Products(uRes.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
  }, []);

  const nextSlider = () => setCurrentSlider(prev => (prev + 1) % sliders.length);
  const prevSlider = () => setCurrentSlider(prev => (prev - 1 + sliders.length) % sliders.length);

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Slider */}
      <section className="relative h-[60vh] lg:h-[80vh] overflow-hidden bg-gray-100">
        {sliders.length > 0 ? (
          <>
            <div className="absolute inset-0">
              {sliders.map((slider, idx) => (
                <motion.div
                  key={slider.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: idx === currentSlider ? 1 : 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <Link 
                    to={slider.category_id ? `/products?category=${slider.category_id}` : '/products'}
                    className="block w-full h-full"
                  >
                    <picture>
                      <source media="(max-width: 768px)" srcSet={slider.mobile_banner} />
                      <img 
                        src={slider.desktop_banner} 
                        alt="Banner" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </picture>
                  </Link>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-center px-4 pointer-events-none">
                    <div className="max-w-3xl pointer-events-auto">
                      {slider.show_description && (
                        <motion.p 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: idx === currentSlider ? 0 : 20, opacity: idx === currentSlider ? 1 : 0 }}
                          className="text-white text-lg lg:text-2xl font-medium mb-6"
                        >
                          {slider.description}
                        </motion.p>
                      )}
                      {slider.show_button && (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: idx === currentSlider ? 0 : 20, opacity: idx === currentSlider ? 1 : 0 }}
                        >
                          <Link 
                            to={slider.category_id ? `/products?category=${slider.category_id}` : '/products'}
                            className="inline-block bg-white text-black px-10 py-4 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                          >
                            {slider.button_text || 'Shop Now'}
                          </Link>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <button onClick={prevSlider} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full transition-colors z-10">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextSlider} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full transition-colors z-10">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-pink-light">
            <p className="text-brand-pink font-bold uppercase tracking-widest font-serif text-lg">Being Women Collection</p>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold tracking-tight text-center text-brand-brown font-serif mb-2">Shop by Category</h2>
        <p className="text-neutral-500 text-xs text-center uppercase tracking-widest mb-8">Curated Elegant Styles</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-8">
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              to={`/products?category=${cat.id}`}
              className="group text-center block"
            >
              <div className="aspect-[3/4] overflow-hidden bg-brand-pink-light mb-4 rounded-[14px] shadow-xs group-hover:shadow-md transition-all border border-brand-pink/10">
                <img 
                  src={cat.image_url} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-neutral-700 group-hover:text-brand-pink transition-colors">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-brand-brown font-serif">New Arrivals</h2>
              <p className="text-neutral-500 text-xs uppercase tracking-widest mt-1">Our latest premium collection</p>
            </div>
            <Link to="/products" className="text-xs font-bold uppercase tracking-widest text-brand-pink border-b-2 border-brand-pink pb-1 hover:text-brand-pink-hover hover:border-brand-pink-hover transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {newArrivals.map(product => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Under 599 Section */}
      {under599Products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-brand-brown font-serif">Budget Store @599</h2>
              <p className="text-neutral-500 text-xs uppercase tracking-widest mt-1">Quality fashion at unbeatable prices</p>
            </div>
            <Link to="/products" className="text-xs font-bold uppercase tracking-widest text-brand-pink border-b-2 border-brand-pink pb-1 hover:text-brand-pink-hover hover:border-brand-pink-hover transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {under599Products.map(product => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Promo Section */}
      <section className="bg-gradient-to-br from-[#241815] to-brand-brown text-white py-20 px-4 rounded-[14px] max-w-7xl mx-auto shadow-xl border border-brand-brown/10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-brand-pink text-xs font-bold uppercase tracking-widest">Exquisite Designs</span>
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tight font-serif mt-2 mb-6">Premium Collection</h2>
          <p className="text-neutral-300 max-w-2xl mx-auto mb-10 text-sm leading-relaxed">
            Experience the ultimate in premium women's wear, handcrafted designer sarees, and stylish ethnic outfits that honor your elegance.
          </p>
          <Link to="/products?tag=Premium" className="inline-block bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white px-12 py-4 font-bold rounded-full text-xs uppercase tracking-widest hover:shadow-lg transition-all transform hover:-translate-y-0.5 duration-200">
            Explore Premium
          </Link>
        </div>
      </section>
    </div>
  );
};

export const ProductCard = ({ product, onRemove, isWishlistPage }: { product: any, onRemove?: () => void, isWishlistPage?: boolean }) => {
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isWishlisted = isInWishlist(product.id);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    const wasWishlisted = isWishlisted;
    await toggleWishlist(product.id);
    if (onRemove && wasWishlisted) onRemove();
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleConfirmAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }
    addToCart({
      id: '', // Will be generated in context
      productId: product.id,
      name: product.name,
      price: product.discount_price,
      image: product.main_image,
      quantity: 1,
      size: selectedSize,
      color: selectedColor
    });
    toast.success('Added to cart!');
    setIsModalOpen(false);
    setSelectedSize('');
    setSelectedColor('');
  };

  return (
    <div className="group relative bg-white p-3.5 rounded-[14px] shadow-xs hover:shadow-md border border-brand-pink/5 hover:-translate-y-1 transition-all duration-300">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-brand-pink-light relative rounded-[14px]">
          <img 
            src={product.main_image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          {product.discount_price < product.original_price && (
            <div className="absolute top-3 left-3 bg-brand-pink text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
              {Math.round((1 - product.discount_price / product.original_price) * 100)}% OFF
            </div>
          )}
          {product.tag && (
            <div className="absolute top-3 right-3 bg-brand-brown text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
              {product.tag}
            </div>
          )}
          
          {/* Quick Add Overlay */}
          <div className={`absolute inset-x-0 bottom-0 p-3 transition-transform bg-white/90 backdrop-blur-xs ${isWishlistPage ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>
            <button 
              onClick={handleQuickAdd}
              className="w-full bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm hover:shadow transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-semibold text-neutral-800 line-clamp-1 group-hover:text-brand-pink transition-colors">{product.name}</h3>
            <button 
              onClick={handleToggle}
              className={`p-1 transition-colors ${isWishlisted ? 'text-brand-pink' : 'text-neutral-400 hover:text-brand-pink'}`}
            >
              {isWishlistPage ? (
                <Trash2 className="w-4 h-4 text-neutral-400 hover:text-brand-pink" />
              ) : (
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-brand-pink' : ''}`} />
              )}
            </button>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-sm font-bold text-neutral-900">₹{product.discount_price}</span>
            {product.discount_price < product.original_price && (
              <span className="text-xs text-neutral-400 line-through">₹{product.original_price}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-semibold text-neutral-500">
              {product.avg_rating ? product.avg_rating.toFixed(1) : '0.0'} ({product.review_count || 0})
            </span>
          </div>
        </div>
      </Link>

      {/* Selection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 bg-white z-[110] rounded-t-3xl p-8 lg:max-w-md lg:mx-auto lg:rounded-3xl lg:bottom-1/2 lg:translate-y-1/2"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase tracking-widest">Select Options</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {(product.sizes || []).map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-xs transition-all ${selectedSize === size ? 'border-brand-pink bg-brand-pink text-white shadow-md' : 'border-neutral-100 text-neutral-700 hover:border-brand-pink hover:bg-brand-pink-light'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400">Color</h3>
                  <div className="flex flex-wrap gap-2">
                    {(product.colors || []).map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-full border-2 font-bold text-xs transition-all ${selectedColor === color ? 'border-brand-pink bg-brand-pink text-white shadow-md' : 'border-neutral-100 text-neutral-700 hover:border-brand-pink hover:bg-brand-pink-light'}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleConfirmAddToCart}
                  disabled={!selectedSize || !selectedColor}
                  className="w-full bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white py-4 rounded-[14px] font-bold uppercase tracking-widest disabled:opacity-50 text-xs shadow-md hover:shadow-lg transition-all"
                >
                  Confirm & Add to Cart
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
