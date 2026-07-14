import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { XCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export const OrderFailed = () => {
  const { orderId } = useParams();
  const queryParams = new URLSearchParams(window.location.search);
  const error = queryParams.get('error');

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12" />
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-widest">Order Failed</h1>
          <p className="text-gray-500">
            {orderId ? (
              <>Unfortunately, your payment for order <span className="font-bold text-black">#{String(orderId).padStart(8, '0')}</span> was unsuccessful.</>
            ) : (
              <>Unfortunately, your payment transaction or security verification failed. Your cart remains saved, and no money was charged for a new order.</>
            )}
          </p>
          {error === 'checksum_mismatch' && (
            <div className="bg-amber-50 text-amber-600 p-4 rounded-xl flex items-center space-x-3 text-sm">
              <AlertTriangle className="w-5 h-5" />
              <p>Security verification failed. Please try again.</p>
            </div>
          )}
        </div>
        <div className="pt-8 flex flex-col space-y-4">
          <Link 
            to="/checkout" 
            className="bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all"
          >
            Retry Payment
          </Link>
          <Link 
            to="/contact" 
            className="text-gray-500 font-bold hover:text-black transition-all"
          >
            Contact Support
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
