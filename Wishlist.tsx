import { useState, useEffect } from 'react';
import { wishlistApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from './Home';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Wishlist = () => {
  const { user } = useAuth();
  const { wishlistIds, refreshWishlist } = useWishlist();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, wishlistIds]);

  const fetchWishlist = async () => {
    try {
      const { data } = await wishlistApi.getAll();
      if (data) setWishlist(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Please Login</h2>
        <p className="text-gray-500 mb-8">Login to see your saved items.</p>
        <Link to="/account" className="inline-block bg-black text-white px-10 py-4 font-bold uppercase tracking-widest">Login Now</Link>
      </div>
    );
  }

  const filteredWishlist = wishlist.filter(p => wishlistIds.has(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-12">My Wishlist ({wishlistIds.size})</h1>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-gray-100 rounded-3xl" />)}
        </div>
      ) : filteredWishlist.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredWishlist.map(product => (
            <div key={product.id}>
              <ProductCard product={product} onRemove={fetchWishlist} isWishlistPage={true} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest">Your wishlist is empty</p>
        </div>
      )}
    </div>
  );
};
