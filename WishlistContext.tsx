import React, { createContext, useContext, useState, useEffect } from 'react';
import { wishlistApi } from '../lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WishlistContextType {
  wishlistIds: Set<number>;
  toggleWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  loading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const refreshWishlist = async () => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    try {
      const { data } = await wishlistApi.getAll();
      if (data) {
        setWishlistIds(new Set(data.map((p: any) => p.id)));
      }
    } catch (error) {
      console.error('Error fetching wishlist ids:', error);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [user]);

  const toggleWishlist = async (productId: number) => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    const isCurrentlyWishlisted = wishlistIds.has(productId);
    
    // Optimistic update
    const newIds = new Set(wishlistIds);
    if (isCurrentlyWishlisted) {
      newIds.delete(productId);
    } else {
      newIds.add(productId);
    }
    setWishlistIds(newIds);

    try {
      if (isCurrentlyWishlisted) {
        await wishlistApi.remove(productId.toString());
        toast.success('Removed from wishlist');
      } else {
        await wishlistApi.toggle(productId.toString());
        toast.success('Added to wishlist');
      }
    } catch (error) {
      // Rollback on error
      setWishlistIds(wishlistIds);
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const isInWishlist = (productId: number) => wishlistIds.has(productId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist, loading, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
