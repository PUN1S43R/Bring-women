import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi, reviewsApi, wishlistApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, RefreshCcw, ChevronRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from './Home';
import toast from 'react-hot-toast';

export const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist: toggleWishlistGlobal } = useWishlist();
  const [product, setProduct] = useState<any>(null);
  const isWishlisted = product ? isInWishlist(product.id) : false;
  const [images, setImages] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const { addToCart } = useCart();

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const { data } = await reviewsApi.getByProduct(id);
      if (data) setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const { data: p } = await productsApi.getById(id);
        if (p) {
          setProduct(p);
          setSelectedImage(p.main_image);
          
          const allImages = [{ image_url: p.main_image }, ...(p.additional_images || []).map((url: string) => ({ image_url: url }))];
          setImages(allImages);

          const { data: related } = await productsApi.getAll({
            category: p.category_id,
            limit: 8
          });
          setRelatedProducts((related || []).filter((item: any) => item.id.toString() !== id.toString()));

          fetchReviews();
        }
      } catch (error) {
        console.error('Error fetching product detail:', error);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const toggleWishlist = async () => {
    if (!product) return;
    await toggleWishlistGlobal(product.id);
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      setIsModalOpen(true);
      return;
    }
    addToCart({
      id: '',
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
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }
    if (!id) return;

    try {
      await reviewsApi.create(id, {
        product_id: id,
        rating: newReview.rating,
        comment: newReview.comment
      });
      toast.success('Review submitted successfully!');
      setIsReviewModalOpen(false);
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    }
  };

  if (!product) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] overflow-hidden bg-gray-100 rounded-lg">
            <img 
              src={selectedImage} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(img.image_url)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img.image_url ? 'border-black' : 'border-transparent'}`}
              >
                <img src={img.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-brown font-serif mb-2 uppercase">{product.name}</h1>
            <p className="text-neutral-500 text-sm mb-4 leading-relaxed">{product.description}</p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-brand-pink-light/50 px-3 py-1 rounded-full text-brand-pink">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                <span className="text-xs font-bold">
                  {product.avg_rating ? product.avg_rating.toFixed(1) : '0.0'}
                </span>
                <span className="mx-2 text-brand-pink/20">|</span>
                <span className="text-xs font-semibold text-brand-brown">{product.review_count || 0} Reviews</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-brand-pink/10">
            <div className="flex items-baseline space-x-4 mb-1">
              <span className="text-3xl font-extrabold text-neutral-900">₹{product.discount_price}</span>
              <span className="text-lg text-neutral-400 line-through">MRP ₹{product.original_price}</span>
              <span className="text-md text-brand-pink font-extrabold">
                ({Math.round((1 - product.discount_price / product.original_price) * 100)}% OFF)
              </span>
            </div>
            <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">inclusive of all taxes</p>

            {/* Stock Level Warning System */}
            {product.stock_quantity === 0 ? (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-[14px]">
                <p className="text-red-600 text-xs font-bold flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  Currently Out of Stock
                </p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter your email to get notified" 
                    className="flex-1 px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-brand-pink bg-white"
                    id="notify-email-detail"
                  />
                  <button 
                    onClick={() => {
                      const emailInput = document.getElementById('notify-email-detail') as HTMLInputElement;
                      if (emailInput && emailInput.value) {
                        toast.success("Thank you! We'll notify you as soon as this is back in stock.");
                        emailInput.value = '';
                      } else {
                        toast.error("Please enter a valid email address");
                      }
                    }}
                    className="bg-brand-brown text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-brown/95 transition-all shadow-xs"
                  >
                    Notify Me
                  </button>
                </div>
              </div>
            ) : product.stock_quantity <= 5 ? (
              <div className="mt-6 p-3 bg-brand-pink-light/50 border border-brand-pink/20 rounded-[14px]">
                <p className="text-brand-pink text-xs font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-ping" />
                  Hurry! Only {product.stock_quantity} items left in stock!
                </p>
              </div>
            ) : (
              <div className="mt-6 p-3 bg-emerald-50 border border-emerald-100 rounded-[14px]">
                <p className="text-emerald-600 text-xs font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  In Stock (Ready to Ship)
                </p>
              </div>
            )}
          </div>

          {/* Size Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold uppercase tracking-widest text-xs text-neutral-500">Select Size</h3>
              <button className="text-brand-pink text-xs font-bold uppercase tracking-widest hover:text-brand-pink-hover transition-colors">Size Chart</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {(product.sizes || []).map((size: string) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 flex items-center justify-center rounded-full border-2 font-bold transition-all ${selectedSize === size ? 'border-brand-pink bg-brand-pink text-white shadow-md' : 'border-neutral-100 text-neutral-700 hover:border-brand-pink hover:bg-brand-pink-light'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-4">
            <h3 className="font-bold uppercase tracking-widest text-xs text-neutral-500">Select Color</h3>
            <div className="flex flex-wrap gap-3">
              {(product.colors || []).map((color: string) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-6 py-2.5 rounded-full border-2 font-bold text-xs transition-all ${selectedColor === color ? 'border-brand-pink bg-brand-pink text-white shadow-md' : 'border-neutral-100 text-neutral-700 hover:border-brand-pink hover:bg-brand-pink-light'}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <button 
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className={`flex-1 py-5 rounded-[14px] font-bold uppercase tracking-widest flex items-center justify-center space-x-3 transition-all ${
                product.stock_quantity === 0 
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed text-xs' 
                  : 'bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white hover:shadow-lg transform hover:-translate-y-0.5 duration-200 text-xs'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
            <button 
              onClick={toggleWishlist}
              className={`w-16 h-16 flex items-center justify-center rounded-[14px] border-2 transition-all ${isWishlisted ? 'border-brand-pink text-brand-pink bg-brand-pink-light' : 'border-neutral-100 text-neutral-400 hover:border-brand-pink hover:text-brand-pink hover:bg-brand-pink-light'}`}
            >
              <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-brand-pink/10">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand-pink-light text-brand-pink rounded-xl"><Truck className="w-6 h-6" /></div>
              <div>
                <p className="font-bold text-sm text-brand-brown font-serif">Free Delivery</p>
                <p className="text-xs text-neutral-400">On orders above ₹2000</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand-pink-light text-brand-pink rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
              <div>
                <p className="font-bold text-sm text-brand-brown font-serif">Authentic</p>
                <p className="text-xs text-neutral-400">100% Genuine Quality</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand-pink-light text-brand-pink rounded-xl"><RefreshCcw className="w-6 h-6" /></div>
              <div>
                <p className="font-bold text-sm text-brand-brown font-serif">Easy Returns</p>
                <p className="text-xs text-neutral-400">15 Days Return Policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest">Customer Reviews</h2>
            <p className="text-gray-500 text-sm">What our customers are saying</p>
          </div>
          <button 
            onClick={() => setIsReviewModalOpen(true)}
            className="text-sm font-bold uppercase tracking-widest border-b-2 border-black pb-1"
          >
            Write a Review
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.length > 0 ? reviews.map(review => (
            <div key={review.id} className="bg-gray-50 p-8 rounded-lg space-y-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed italic">"{review.comment}"</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-xs">
                  {review.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-bold text-sm">{review.full_name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-400">Verified Buyer</p>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-gray-400 italic">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </section>

      {/* Related Products */}
      <section className="mt-24">
        <h2 className="text-2xl font-black uppercase tracking-widest mb-8">Related Products</h2>
        <div className="flex overflow-x-auto space-x-6 pb-8 scrollbar-hide">
          {relatedProducts.map(p => (
            <div key={p.id} className="flex-shrink-0 w-64">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

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
                className="fixed inset-x-0 bottom-0 bg-white z-[110] rounded-t-[24px] p-8 lg:max-w-xl lg:mx-auto lg:rounded-[24px] lg:bottom-1/2 lg:translate-y-1/2 border border-brand-pink/5"
              >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-brand-brown font-serif">Select Options</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-brand-pink transition-colors"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-bold uppercase tracking-widest text-xs text-neutral-400">Size</h3>
                  <div className="flex flex-wrap gap-3">
                    {(product.sizes || []).map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 flex items-center justify-center rounded-full border-2 font-bold transition-all ${selectedSize === size ? 'border-brand-pink bg-brand-pink text-white shadow-md' : 'border-neutral-100 text-neutral-700 hover:border-brand-pink hover:bg-brand-pink-light'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold uppercase tracking-widest text-xs text-neutral-400">Color</h3>
                  <div className="flex flex-wrap gap-3">
                    {(product.colors || []).map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-6 py-2.5 rounded-full border-2 font-bold text-xs transition-all ${selectedColor === color ? 'border-brand-pink bg-brand-pink text-white shadow-md' : 'border-neutral-100 text-neutral-700 hover:border-brand-pink hover:bg-brand-pink-light'}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor || product.stock_quantity === 0}
                  className="w-full bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white py-4 rounded-[14px] font-bold uppercase tracking-widest disabled:opacity-50 text-xs shadow-md hover:shadow-lg transition-all"
                >
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Confirm & Add to Cart'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[110] rounded-lg p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-widest">Write a Review</h2>
                <button onClick={() => setIsReviewModalOpen(false)}><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="p-1"
                      >
                        <Star className={`w-8 h-8 ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Your Review</label>
                  <textarea
                    required
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-lg p-4 text-sm focus:ring-2 focus:ring-black min-h-[120px]"
                    placeholder="Tell us what you think about this product..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-4 rounded-lg font-black uppercase tracking-widest hover:bg-gray-900 transition-colors"
                >
                  Submit Review
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
