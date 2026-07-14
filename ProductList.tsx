import { useState, useEffect, useRef, useCallback } from 'react';
import { productsApi, categoriesApi } from '../lib/api';
import { useSearchParams, useParams } from 'react-router-dom';
import { ProductCard } from './Home';
import { Filter, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProductList = () => {
  const { categoryId: paramCategoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const categoryQuery = searchParams.get('category');
  const tag = searchParams.get('tag');
  const query = searchParams.get('q');
  const sort = searchParams.get('sort') || 'newest';

  const effectiveCategoryId = paramCategoryId || categoryQuery;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      try {
        const [pRes, cRes] = await Promise.all([
          productsApi.getAll({
            category: effectiveCategoryId,
            tag: tag,
            q: query,
            sort: sort,
            limit: 12,
            page: 1
          }),
          categoriesApi.getAll()
        ]);

        if (Array.isArray(pRes.data)) {
          setProducts(pRes.data);
          if (pRes.data.length < 12) setHasMore(false);
        } else {
          setProducts([]);
          setHasMore(false);
        }
        if (cRes.data) setCategories(cRes.data);
      } catch (error) {
        console.error('Error fetching product list data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [effectiveCategoryId, tag, query, sort]);

  useEffect(() => {
    if (page === 1) return;

    const fetchMoreData = async () => {
      setLoadingMore(true);
      try {
        const { data } = await productsApi.getAll({
          category: effectiveCategoryId,
          tag: tag,
          q: query,
          sort: sort,
          limit: 12,
          page: page
        });

        if (Array.isArray(data)) {
          setProducts(prev => [...prev, ...data]);
          if (data.length < 12) setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching more products:', error);
      } finally {
        setLoadingMore(false);
      }
    };
    fetchMoreData();
  }, [page]);

  const handleSort = (newSort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
    setIsSortOpen(false);
  };

  const handleCategoryFilter = (catId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId) {
      newParams.set('category', catId);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
    setIsFilterOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest">
            {tag ? `${tag} Collection` : effectiveCategoryId ? `${categories.find(c => c.id.toString() === effectiveCategoryId.toString())?.name || ''} Collection` : 'All Products'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} Items found</p>
        </div>
        
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none">
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-100 px-6 py-3 rounded-lg font-bold text-sm hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              
              {/* Filter Drawer/Dropdown */}
              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden" 
                      onClick={() => setIsFilterOpen(false)}
                    />
                    <motion.div 
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="fixed inset-x-0 bottom-0 bg-white z-[70] p-6 rounded-t-[32px] md:absolute md:inset-auto md:top-full md:right-0 md:mt-2 md:w-64 md:border md:border-gray-100 md:shadow-xl md:p-4 md:rounded-2xl md:translate-y-0"
                    >
                      <div className="flex justify-between items-center mb-6 md:mb-4">
                        <h3 className="font-black uppercase text-sm tracking-widest">Categories</h3>
                        <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><X className="w-5 h-5 md:w-4 md:h-4" /></button>
                      </div>
                      <div className="space-y-1 max-h-[60vh] overflow-y-auto md:max-h-none custom-scrollbar">
                        <button 
                          onClick={() => handleCategoryFilter(null)}
                          className={`block w-full text-left px-5 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${!effectiveCategoryId ? 'bg-black text-white shadow-lg shadow-black/10' : 'hover:bg-gray-50 text-gray-500'}`}
                        >
                          All Categories
                        </button>
                        {categories.map(cat => (
                          <button 
                            key={cat.id}
                            onClick={() => handleCategoryFilter(cat.id)}
                            className={`block w-full text-left px-5 py-4 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${effectiveCategoryId === cat.id ? 'bg-black text-white shadow-lg shadow-black/10' : 'hover:bg-gray-50 text-gray-500'}`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 md:flex-none">
              <button 
                onClick={() => setIsSortOpen(true)}
                className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-100 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all active:scale-95"
              >
                <span>Sort By</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Sort Drawer/Dropdown */}
              <AnimatePresence>
                {isSortOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden" 
                      onClick={() => setIsSortOpen(false)}
                    />
                    <motion.div 
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="fixed inset-x-0 bottom-0 bg-white z-[70] p-6 rounded-t-[32px] md:absolute md:inset-auto md:top-full md:right-0 md:mt-2 md:w-56 md:border md:border-gray-100 md:shadow-xl md:p-2 md:rounded-2xl md:translate-y-0"
                    >
                      <div className="flex justify-between items-center mb-6 md:hidden">
                        <h3 className="font-black uppercase text-sm tracking-widest">Sort By</h3>
                        <button onClick={() => setIsSortOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                      </div>
                      <div className="space-y-1">
                        {[
                          { label: 'Newest First', value: 'newest' },
                          { label: 'Price: Low to High', value: 'price-low' },
                          { label: 'Price: High to Low', value: 'price-high' }
                        ].map(opt => (
                          <button 
                            key={opt.value}
                            onClick={() => handleSort(opt.value)}
                            className={`block w-full text-left px-5 py-4 md:px-4 md:py-2.5 rounded-2xl md:rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${sort === opt.value ? 'bg-black text-white shadow-lg shadow-black/10' : 'hover:bg-gray-50 text-gray-500'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : Array.isArray(products) && products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <div 
                key={product.id}
                ref={index === products.length - 1 ? lastProductElementRef : null}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          {loadingMore && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400 font-bold uppercase tracking-widest">No products found</p>
        </div>
      )}
    </div>
  );
};
