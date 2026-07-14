import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { paymentApi } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, CreditCard, Truck } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    // Load Razorpay Script
    const razorpayScript = document.createElement('script');
    razorpayScript.src = "https://checkout.razorpay.com/v1/checkout.js";
    razorpayScript.async = true;
    document.body.appendChild(razorpayScript);

    return () => {
      document.body.removeChild(razorpayScript);
    };
  }, []);

  const handlePaymentAndOrderAndRedirect = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const shippingCharge = total > 2000 ? 0 : 99;
      const tax = Math.round(total * 0.05);
      const finalTotal = total + shippingCharge + tax;
      const requiredAmount = paymentMethod === 'COD' ? 150 : finalTotal;

      const orderPayload = {
        amount: requiredAmount,
        shipping_address: `${address.fullName}, ${address.phone}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
        phone: address.phone,
        payment_method: paymentMethod,
        full_name: address.fullName,
        email: user.email,
        items: cart.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color
        }))
      };

      // 1. Create order on secure backend to get Razorpay Order ID
      const { data: orderData } = await paymentApi.createRazorpayOrder(orderPayload);

      // 2. Open Razorpay Checkout modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Being Women",
        description: paymentMethod === 'COD' ? "COD Advance Payment" : "Order Payment",
        order_id: orderData.id,
        handler: async function (response: any) {
          setLoading(true);
          try {
            // 3. Verify signature on backend securely
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };

            const verifyRes = await paymentApi.verifyRazorpaySignature(verifyPayload);

            if (verifyRes.data && verifyRes.data.success) {
              toast.success("Payment Verified & Order Placed!");
              // Only clear cart after backend success is verified!
              clearCart();
              navigate(`/order-success/${verifyRes.data.orderId}`);
            } else {
              toast.error("Payment Verification Failed");
              navigate('/order-failed');
            }
          } catch (err: any) {
            console.error("Verification Error:", err);
            toast.error(err.response?.data?.error || "Payment verification failed");
            navigate('/order-failed');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: address.fullName,
          email: user?.email,
          contact: address.phone
        },
        theme: {
          color: "#000000"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.error("Payment cancelled by customer");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setLoading(false);
        console.error("Razorpay Failure Response:", response.error);
        toast.error("Payment Failed");
        navigate('/order-failed');
      });
      rzp.open();
    } catch (error: any) {
      setLoading(false);
      console.error("Razorpay Order Creation Flow Error:", error);
      toast.error(error.response?.data?.error || "Failed to initiate payment. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePaymentAndOrderAndRedirect();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-12">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Shipping Details */}
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">1</div>
              <h2 className="text-xl font-black uppercase tracking-widest">Shipping Address</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                required
                placeholder="Full Name"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.fullName}
                onChange={e => setAddress({...address, fullName: e.target.value})}
              />
              <input 
                required
                placeholder="Phone Number"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.phone}
                onChange={e => setAddress({...address, phone: e.target.value})}
              />
              <input 
                required
                placeholder="Street Address"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black md:col-span-2"
                value={address.street}
                onChange={e => setAddress({...address, street: e.target.value})}
              />
              <input 
                required
                placeholder="City"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.city}
                onChange={e => setAddress({...address, city: e.target.value})}
              />
              <input 
                required
                placeholder="State"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.state}
                onChange={e => setAddress({...address, state: e.target.value})}
              />
              <input 
                required
                placeholder="Pincode"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.pincode}
                onChange={e => setAddress({...address, pincode: e.target.value})}
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-black uppercase tracking-widest">Payment Method</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setPaymentMethod('Razorpay')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${paymentMethod === 'Razorpay' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-black'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <CreditCard className="w-6 h-6" />
                  {paymentMethod === 'Razorpay' && <ShieldCheck className="w-5 h-5" />}
                </div>
                <p className="font-black uppercase tracking-widest">Razorpay Online</p>
                <p className={`text-xs mt-1 ${paymentMethod === 'Razorpay' ? 'text-gray-400' : 'text-gray-500'}`}>UPI / Cards / Netbanking</p>
              </button>
              <button 
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${paymentMethod === 'COD' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-black'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <Truck className="w-6 h-6" />
                  {paymentMethod === 'COD' && <ShieldCheck className="w-5 h-5" />}
                </div>
                <p className="font-black uppercase tracking-widest">COD with Advance</p>
                <p className={`text-xs mt-1 ${paymentMethod === 'COD' ? 'text-gray-400' : 'text-gray-500'}`}>₹150 Advance Paid Online</p>
              </button>
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="space-y-8">
          <div className="bg-gray-50 p-8 rounded-xl space-y-6 sticky top-24">
            <h2 className="font-black uppercase tracking-widest text-lg">Order Summary</h2>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.name} x {item.quantity}</span>
                  <span className="font-bold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-200 space-y-4 text-sm">
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
              {paymentMethod === 'COD' && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>COD Advance</span>
                  <span>₹150</span>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-black uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black">₹{total + (total > 2000 ? 0 : 99) + Math.round(total * 0.05)}</span>
              </div>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : paymentMethod === 'COD' ? 'Pay ₹150 & Place Order' : `Pay via ${paymentMethod} & Place Order`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
