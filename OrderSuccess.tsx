import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const OrderSuccess = () => {
  const { orderId } = useParams();
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12" />
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-widest">Order Success!</h1>
          <p className="text-gray-500">
            Thank you for your purchase. Your order ID is <span className="font-bold text-black">#{String(orderId).padStart(8, '0')}</span>.
          </p>
          <p className="text-sm text-gray-400 italic">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
        <div className="pt-8 flex flex-col space-y-4">
          <Link 
            to="/account/orders" 
            className="bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all"
          >
            View My Orders
          </Link>
          <Link 
            to="/" 
            className="text-gray-500 font-bold hover:text-black transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
