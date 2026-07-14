import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="inline-block bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-12">Shopping Bag ({cart.length})</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map(item => (
            <motion.div 
              layout
              key={item.id} 
              className="flex items-center space-x-6 p-6 bg-white border border-gray-100 rounded-xl"
            >
              <div className="w-24 h-32 lg:w-32 lg:h-40 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold uppercase text-sm lg:text-base">{item.name}</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Size: {item.size} | Color: {item.color}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 hover:text-red-600 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center space-x-4 pt-4">
                  <div className="flex items-center border border-gray-100 rounded-full px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-50 rounded-full"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-50 rounded-full"><Plus className="w-4 h-4" /></button>
                  </div>
                  <span className="font-black">₹{item.price * item.quantity}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-8">
          <div className="bg-gray-50 p-8 rounded-xl space-y-6">
            <h2 className="font-black uppercase tracking-widest text-lg">Order Summary</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold">₹{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-bold text-emerald-600">{total > 2000 ? 'FREE' : '₹99'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (5%)</span>
                <span className="font-bold">₹{Math.round(total * 0.05)}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-black uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black">₹{total + (total > 2000 ? 0 : 99) + Math.round(total * 0.05)}</span>
              </div>
            </div>
            <Link 
              to="/checkout" 
              className="w-full bg-black text-white py-5 rounded-xl font-black uppercase tracking-widest flex items-center justify-center space-x-3 hover:bg-gray-900 transition-colors"
            >
              <span>Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
            <p className="text-emerald-800 text-xs font-bold uppercase tracking-widest text-center">
              {total > 2000 ? '🎉 You unlocked FREE SHIPPING!' : `Add ₹${2000 - total} more for FREE SHIPPING`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
