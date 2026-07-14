import React, { useState, useEffect } from 'react';
import { authApi, ordersApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Package, User, LogOut, Key, ChevronRight, Mail, Phone, MapPin, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

export const Account = () => {
  const { user, role, loading, signOut: authSignOut, setUser, setRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as any) || (user ? 'profile' : 'login');

  const setView = (newView: string) => {
    setSearchParams({ view: newView });
  };

  const signOut = async () => {
    const loadingToast = toast.loading('Logging out...');
    await authSignOut();
    setView('login');
    toast.success('Logged out successfully', { id: loadingToast });
  };
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setState(user.state || '');
      setPincode(user.pincode || '');
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data } = await ordersApi.getMy();
      // For each order, fetch items
      const ordersWithItems = await Promise.all(data.map(async (order: any) => {
        const { data: items } = await ordersApi.getItems(order.id);
        return { ...order, order_items: items };
      }));
      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Logging in...');
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_role', data.user.role);
      setUser(data.user);
      setRole(data.user.role);
      toast.success('Logged in successfully!', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to login', { id: loadingToast });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Creating account...');
    try {
      const { data } = await authApi.register({ email, password });
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_role', data.user.role);
      setUser(data.user);
      setRole(data.user.role);
      toast.success('Registration successful!', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to register', { id: loadingToast });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    const loadingToast = toast.loading('Updating password...');
    try {
      if (user) {
        // Logged in user updating password
        await authApi.updatePassword({ password: newPassword });
      } else {
        // Forgot password flow
        await authApi.resetPassword({ email, password: newPassword });
      }
      toast.success('Password updated successfully', { id: loadingToast });
      setNewPassword('');
      if (!user) setView('login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password', { id: loadingToast });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Generating OTP code...');
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      await authApi.sendOtp({ email, otp: code });
      toast.success('OTP code sent to your email!', { id: loadingToast });
      setView('verify-otp');
    } catch (error: any) {
      toast.error('Failed to send OTP', { id: loadingToast });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      toast.success('Code verified!');
      setView('update-password');
    } else {
      toast.error('Invalid code. Please check your email.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const loadingToast = toast.loading('Updating profile...');
    try {
      const { data } = await authApi.updateProfile({
        full_name: fullName,
        phone,
        address,
        state,
        pincode,
      });
      setUser(data.user);
      toast.success('Profile updated successfully!', { id: loadingToast });
    } catch (error: any) {
      toast.error('Failed to update profile', { id: loadingToast });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-xl">
          <h1 className="text-3xl font-black uppercase tracking-widest mb-8 text-center">
            {view === 'login' ? 'Welcome Back' : 
             view === 'register' ? 'Join Us' : 
             view === 'verify-otp' ? 'Verify Code' : 
             view === 'update-password' ? 'New Password' : 'Reset Password'}
          </h1>

          <form onSubmit={
            view === 'login' ? handleLogin : 
            view === 'register' ? handleRegister : 
            view === 'verify-otp' ? handleVerifyOtp :
            view === 'update-password' ? handleUpdatePassword :
            handleForgotPassword
          } className="space-y-6">
            {view === 'register' && (
              <input 
                required
                placeholder="Full Name"
                className="w-full bg-gray-50 border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-black"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            )}
            
            {(view !== 'verify-otp' && view !== 'update-password') && (
              <input 
                required
                type="email"
                placeholder="Email Address"
                className="w-full bg-gray-50 border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-black"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            )}

            {view === 'verify-otp' && (
              <div className="space-y-4">
                <p className="text-center text-sm text-gray-500">Enter the 6-digit code sent to <span className="font-bold text-black">{email}</span></p>
                <input 
                  required
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full bg-gray-50 border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-black text-center text-2xl font-black tracking-[1em]"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              </div>
            )}

            {view === 'update-password' && (
              <div className="space-y-4">
                <p className="text-center text-sm text-gray-500">Set a new password for <span className="font-bold text-black">{email}</span></p>
                <input 
                  required
                  type="password"
                  placeholder="New Password"
                  className="w-full bg-gray-50 border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-black"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
            )}

            {(view === 'login' || view === 'register') && (
              <input 
                required
                type="password"
                placeholder="Password"
                className="w-full bg-gray-50 border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-black"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            )}
            
            <button className="w-full bg-black text-white py-5 rounded-lg font-black uppercase tracking-widest hover:bg-gray-900 transition-colors">
              {view === 'login' ? 'Login' : 
               view === 'register' ? 'Register' : 
               view === 'verify-otp' ? 'Verify & Continue' : 
               view === 'update-password' ? 'Update Password' : 'Send OTP Code'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            {view === 'login' ? (
              <>
                <button onClick={() => setView('forgot-password')} className="text-sm text-gray-400 hover:text-black">Forgot Password?</button>
                <p className="text-sm text-gray-500">Don't have an account? <button onClick={() => setView('register')} className="font-bold text-black border-b border-black">Sign Up</button></p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Already have an account? <button onClick={() => setView('login')} className="font-bold text-black border-b border-black">Login</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-8 rounded-lg border border-gray-100 text-center mb-8">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">
              {user.email?.[0].toUpperCase()}
            </div>
            <h2 className="font-black uppercase tracking-widest truncate">{user.email}</h2>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 px-2 py-1 bg-gray-100 rounded inline-block">
              {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Administrator' : 'Member'}
            </p>
          </div>
          
          <nav className="space-y-2">
            {(role === 'admin' || role === 'superadmin') && (
              <AccountLink 
                icon={LayoutDashboard} 
                label="Admin Panel" 
                onClick={() => window.location.href = '/admin'} 
              />
            )}
            <AccountLink icon={User} label="Profile" active={view === 'profile'} onClick={() => setView('profile')} />
            <AccountLink icon={Package} label="My Orders" active={view === 'orders'} onClick={() => setView('orders')} />
            <AccountLink icon={Key} label="Change Password" active={view === 'update-password'} onClick={() => setView('update-password')} />
            
            <button 
              onClick={signOut}
              className="w-full flex items-center space-x-3 px-6 py-4 rounded-lg font-bold text-sm text-red-600 hover:bg-red-50 transition-all mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {view === 'profile' && (
            <div className="bg-white p-8 rounded-lg border border-gray-100 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-widest">Account Details</h3>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Your Name"
                        className="w-full bg-gray-50 border-none rounded-lg pl-12 pr-6 py-4 focus:ring-2 focus:ring-black font-bold"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        disabled
                        type="email"
                        className="w-full bg-gray-100 border-none rounded-lg pl-12 pr-6 py-4 text-gray-500 font-bold cursor-not-allowed"
                        value={user.email}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="tel"
                        placeholder="Your Phone Number"
                        className="w-full bg-gray-50 border-none rounded-lg pl-12 pr-6 py-4 focus:ring-2 focus:ring-black font-bold"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <textarea 
                        rows={3}
                        placeholder="House No, Street, Area"
                        className="w-full bg-gray-50 border-none rounded-lg pl-12 pr-6 py-4 focus:ring-2 focus:ring-black font-bold resize-none"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">State</label>
                    <input 
                      type="text"
                      placeholder="e.g. Maharashtra"
                      className="w-full bg-gray-50 border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                      value={state}
                      onChange={e => setState(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pincode</label>
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 400001"
                      className="w-full bg-gray-50 border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                      value={pincode}
                      onChange={e => setPincode(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="bg-black text-white px-8 py-4 rounded-lg font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg shadow-black/10"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {view === 'update-password' && (
            <div className="bg-white p-8 rounded-lg border border-gray-100 space-y-8">
              <h3 className="text-xl font-black uppercase tracking-widest">Update Password</h3>
              <form onSubmit={handleUpdatePassword} className="max-w-md space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">New Password</label>
                  <input 
                    required
                    type="password"
                    placeholder="Enter new password"
                    className="w-full bg-gray-50 border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-black"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <button className="w-full bg-black text-white py-4 rounded-lg font-black uppercase tracking-widest hover:bg-gray-900 transition-colors">
                  Update Password
                </button>
              </form>
            </div>
          )}

          {view === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase tracking-widest mb-8">Order History</h3>
              {orders.length > 0 ? orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-lg border border-gray-100 space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                      <p className="font-black text-sm">#{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <img src={item.main_image} className="w-16 h-20 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-bold text-sm">{item.product_name}</p>
                          <p className="text-xs text-gray-400">Size: {item.size} | Qty: {item.quantity}</p>
                          <p className="font-black text-sm mt-1">₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                    <p className="font-black">Total: ₹{order.total_amount}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-lg border border-gray-100">
                  <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest">No orders found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AccountLink = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-4 rounded-lg font-bold text-sm transition-all ${active ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-black'}`}
  >
    <div className="flex items-center space-x-3">
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </div>
    <ChevronRight className="w-4 h-4" />
  </button>
);
