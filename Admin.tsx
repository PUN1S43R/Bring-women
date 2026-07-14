import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { 
  LayoutDashboard, Package, Grid, Image as ImageIcon, 
  Settings, Users, ShoppingCart, Plus, Edit, Trash2,
  TrendingUp, DollarSign, ShoppingBag, UserCheck,
  Download, Calendar, Wand2, X, Menu, Truck, CreditCard, Sparkles, RefreshCw, Upload, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateImage } from '../lib/gemini';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  AreaChart, Area
} from 'recharts';
import { 
  categoriesApi, 
  productsApi, 
  slidersApi, 
  ordersApi, 
  usersApi, 
  settingsApi, 
  adminApi,
  uploadApi,
  notificationsApi
} from '../lib/api';

export const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { role, user, loading } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('connected');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setDebugLog(prev => [msg, ...prev].slice(0, 20));
  };

  // Check if current user is the owner
  const isOwner = user?.email?.toLowerCase().trim() === 'moinneelam143@gmail.com' || 
                  user?.email?.toLowerCase().trim() === 'aquibbhombal708@gmail.com';

  useEffect(() => {
    addLog('Admin Panel Initialized');
  }, []);

  useEffect(() => {
    if (!loading && role !== 'admin' && role !== 'superadmin' && !isOwner) {
      navigate('/');
    }
  }, [role, loading, isOwner, navigate]);

  // Only show full-screen loading if we don't even have a cached role yet
  if (loading && !role) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F5F5F7] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-6 h-6 text-black animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-brand-pink font-serif mb-2">Being Women</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Initializing Admin Workspace...</p>
        </div>
      </div>
    );
  }

  if (role !== 'admin' && role !== 'superadmin' && !isOwner) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center bg-white">
        <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <X className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Access Denied</h2>
        <p className="text-gray-500 max-w-md font-medium">
          This area is restricted to Being Women administrative staff only.
        </p>
        <div className="bg-gray-50 p-6 sm:p-8 rounded-xl border border-gray-100 w-full max-w-md text-left space-y-6 shadow-xl shadow-black/5">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Account</p>
              <p className="text-sm font-bold truncate">{user?.email || 'Not Logged In'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Owner</p>
              <span className={`text-[10px] font-black px-2 py-1 rounded ${isOwner ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isOwner ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Role</p>
              <p className="text-sm font-bold uppercase text-black">{role || 'None'}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = '/account'}
          className="bg-black text-white px-10 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-900 transition-all active:scale-95"
        >
          Return to Account
        </button>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'categories', icon: Grid, label: 'Categories' },
    { id: 'sliders', icon: ImageIcon, label: 'Hero Sliders' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'users', icon: Users, label: 'User Management' },
    { id: 'settings', icon: Settings, label: 'Store Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-black border-r border-white/10 z-50 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-12 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white font-serif">Being <span className="text-brand-pink font-semibold">Women</span></h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <SidebarLink 
                key={item.id}
                icon={item.icon} 
                label={item.label} 
                active={activeTab === item.id} 
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }} 
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
              connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 
              connectionStatus === 'checking' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500' : 
                connectionStatus === 'checking' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span>{
                connectionStatus === 'connected' ? 'System Online' : 
                connectionStatus === 'checking' ? 'Checking...' : 'System Error'
              }</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-gray-900">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-semibold text-gray-900">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{role}</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center font-bold text-xs border border-gray-200">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'products' && <AdminProducts addLog={addLog} />}
            {activeTab === 'categories' && <AdminCategories addLog={addLog} />}
            {activeTab === 'sliders' && <AdminSliders addLog={addLog} />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'notifications' && <AdminNotifications />}
            {activeTab === 'users' && <AdminUsers />}
            {activeTab === 'settings' && <AdminSettings />}
          </div>
        </main>
      </div>

      {/* Debug Logs for Mobile */}
      {debugLog.length > 0 && (
        <div className="fixed bottom-4 right-4 left-4 lg:left-auto lg:w-96 p-4 bg-black text-green-400 font-mono text-[10px] rounded-lg border border-white/10 z-[100] shadow-2xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold uppercase tracking-widest">Debug Logs (Mobile)</h3>
            <button onClick={() => setDebugLog([])} className="text-white/50 hover:text-white">Clear</button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {debugLog.map((log, i) => (
              <div key={i} className={log.includes('ERROR') ? 'text-red-500' : ''}>
                {`> ${log}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarLink = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-300 ${
      active 
        ? 'bg-white/10 text-white' 
        : 'text-gray-500 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500'}`} />
    <span>{label}</span>
  </button>
);

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [stats, setStats] = useState([
    { label: 'Revenue', value: '₹0', icon: DollarSign, color: 'text-black', bg: 'bg-gray-50' },
    { label: 'Orders', value: '0', icon: ShoppingBag, color: 'text-black', bg: 'bg-gray-50' },
    { label: 'Customers', value: '0', icon: UserCheck, color: 'text-black', bg: 'bg-gray-50' },
    { label: 'Products', value: '0', icon: Package, color: 'text-black', bg: 'bg-gray-50' },
  ]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const { data } = await adminApi.getStats();
      
      setStats([
        { label: 'Revenue', value: `₹${data.stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-black', bg: 'bg-gray-50' },
        { label: 'Orders', value: data.stats.orders.toString(), icon: ShoppingBag, color: 'text-black', bg: 'bg-gray-50' },
        { label: 'Customers', value: data.stats.customers.toString(), icon: UserCheck, color: 'text-black', bg: 'bg-gray-50' },
        { label: 'Products', value: data.stats.products.toString(), icon: Package, color: 'text-black', bg: 'bg-gray-50' },
      ]);

      setRecentActivity(data.recentActivity);
      setChartData(data.chartData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const exportReport = () => {
    const csv = [
      ['Metric', 'Value'],
      ['Total Revenue', stats[0].value],
      ['Active Orders', stats[1].value],
      ['Total Customers', stats[2].value],
      ['Total Products', stats[3].value]
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `store_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Report exported!');
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-black">Dashboard</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Overview of your store's performance.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="flex-1 sm:flex-none bg-gray-50 border-none rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-black outline-none transition-all"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button 
            onClick={exportReport}
            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 shadow-lg shadow-black/10"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} shadow-sm`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
              <h4 className="text-3xl font-black tracking-tight mt-2 text-black">{stat.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-sm font-black uppercase tracking-widest text-black">Revenue Analytics</h3>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#999', fontWeight: 800}} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#999', fontWeight: 800}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    padding: '16px 24px'
                  }}
                  labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#000" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-sm font-black uppercase tracking-widest text-black mb-10">Recent Activity</h3>
          <div className="space-y-8">
            {recentActivity.map((order, i) => (
              <div key={order.id} className="flex items-center gap-5 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-sm">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black">Order #{order.id.toString().slice(0, 8)}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-black">₹{order.total_amount}</p>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-6 h-6 text-gray-200" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin'>('all');
  const { role: currentUserRole } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.getAll();
      let filteredUsers = data || [];
      if (filter === 'admin') {
        filteredUsers = filteredUsers.filter((u: any) => u.role === 'admin' || u.role === 'superadmin');
      }
      setUsers(filteredUsers);
    } catch (error: any) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await usersApi.updateRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateRole(userId, newRole);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest">User Management</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage platform access</p>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest">All Users</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:text-black'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('admin')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'admin' ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:text-black'}`}
            >
              Admins
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Role</th>
                <th className="px-8 py-5">Joined</th>
                <th className="px-8 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-200" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    No users found
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-xs uppercase">
                        {u.full_name?.[0] || u.email?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">{u.full_name || 'No Name'}</p>
                        <p className="text-[10px] font-bold text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${u.role === 'admin' || u.role === 'superadmin' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                      {u.role || 'User'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {currentUserRole === 'superadmin' ? (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => updateRole(u.id, 'user')}
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all ${u.role === 'user' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400 hover:border-black hover:text-black'}`}
                          >
                            User
                          </button>
                          <button 
                            onClick={() => updateRole(u.id, 'admin')}
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all ${u.role === 'admin' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400 hover:border-black hover:text-black'}`}
                          >
                            Admin
                          </button>
                          <button 
                            onClick={() => updateRole(u.id, 'superadmin')}
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all ${u.role === 'superadmin' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400 hover:border-black hover:text-black'}`}
                          >
                            Super
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => toggleAdmin(u.id, u.role)}
                          className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:opacity-50 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                          disabled={u.role === 'superadmin'}
                        >
                          {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [codAdvance, setCodAdvance] = useState(150);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(2000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await settingsApi.getAll();
      if (data) {
        const cod = data.find((s: any) => s.key === 'cod_advance');
        const free = data.find((s: any) => s.key === 'free_shipping_threshold');
        if (cod) setCodAdvance(parseInt(cod.value));
        if (free) setFreeShippingThreshold(parseInt(free.value));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async () => {
    setLoading(true);
    try {
      await Promise.all([
        settingsApi.update('cod_advance', codAdvance.toString()),
        settingsApi.update('free_shipping_threshold', freeShippingThreshold.toString())
      ]);
      toast.success('Settings updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black uppercase tracking-widest">Store Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-orange-50 text-orange-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-xs">COD Rules</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage advance payments</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Advance COD Amount (₹)</label>
            <input 
              type="number"
              className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-black text-xl"
              value={codAdvance}
              onChange={(e) => setCodAdvance(parseInt(e.target.value))}
            />
            <p className="text-[10px] font-bold text-gray-400 italic">This amount must be paid online for COD orders.</p>
          </div>
          
          <button 
            onClick={updateSettings}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update COD Rules'}
          </button>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-xs">Shipping Rules</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage delivery costs</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Free Shipping Threshold (₹)</label>
            <input 
              type="number"
              className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-black text-xl"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(parseInt(e.target.value))}
            />
            <p className="text-[10px] font-bold text-gray-400 italic">Orders above this value get free shipping.</p>
          </div>
          
          <button 
            onClick={updateSettings}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Shipping Rules'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminProducts = ({ addLog }: { addLog: (msg: string) => void }) => {
  const { role, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    main_image: '',
    additional_images: [] as string[],
    original_price: 0,
    discount_price: 0,
    stock_quantity: 0,
    description: '',
    tag: '',
    is_cod_available: true,
    sizes: [] as string[],
    colors: [] as string[],
    new_arrival_days: 7
  });

  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    addLog(`File selected: ${file.name} (${file.size} bytes)`);
    if (!user) {
      addLog('ERROR: No user found. Please log in again.');
      toast.error('Session expired. Please log in again.');
      return;
    }
    
    const loadingToast = toast.loading('Compressing and uploading main image...');
    setIsUploading(true);
    try {
      addLog('Compressing image...');
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.7
      };
      const compressedFile = await imageCompression(file, options);
      addLog(`Compressed: ${compressedFile.size} bytes`);

      addLog('Starting upload to backend...');
      const { data } = await uploadApi.single(compressedFile as any);
      const url = data.url;
      addLog(`Upload success: ${url}`);
      setFormData(prev => ({ ...prev, main_image: url }));
      toast.success('Main image uploaded!', { id: loadingToast });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || JSON.stringify(error);
      addLog(`UPLOAD ERROR: ${errorMsg}`);
      console.error('Upload error:', error);
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingGallery(true);
    const loadingToast = toast.loading(`Compressing and uploading ${files.length} images...`);
    
    try {
      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        initialQuality: 0.6
      };
      
      const compressedFiles = await Promise.all(
        Array.from(files).map(file => (imageCompression as any)(file, options))
      );

      const { data } = await uploadApi.multiple(compressedFiles as any);
      const urls = data.urls;
      setFormData(prev => ({
        ...prev,
        additional_images: [...(prev.additional_images || []), ...urls]
      }));
      toast.success(`${urls.length} images uploaded!`, { id: loadingToast });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(`Gallery upload failed: ${errorMsg}`, { id: loadingToast });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additional_images: prev.additional_images.filter((_, i) => i !== index)
    }));
  };

  const fetchAll = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll()
      ]);
      
      if (pRes.data) setProducts(pRes.data);
      if (cRes.data) setCategories(cRes.data);
    } catch (error) {
      console.error('Error fetching products/categories:', error);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      category_id: product.category_id,
      main_image: product.main_image,
      additional_images: product.additional_images || [],
      original_price: product.original_price,
      discount_price: product.discount_price,
      stock_quantity: product.stock_quantity,
      description: product.description,
      tag: product.tag || '',
      is_cod_available: product.is_cod_available ?? true,
      sizes: product.sizes || [],
      colors: product.colors || [],
      new_arrival_days: product.new_arrival_days || 7
    });
    setEditingId(product.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleGenerateImage = async () => {
    if (!formData.name) return toast.error('Enter product name first');
    setIsGenerating(true);
    try {
      const prompt = `Professional studio product photography of ${formData.name}, clean white background, high detail, 4k`;
      const url = await generateImage(prompt);
      if (url) setFormData({ ...formData, main_image: url });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) {
      toast.error('Please select a category');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id.toString()),
        original_price: Number(formData.original_price),
        discount_price: Number(formData.discount_price),
        stock_quantity: Number(formData.stock_quantity)
      };

      if (isEditMode && editingId) {
        await productsApi.update(editingId, payload);
        toast.success('Product updated!');
      } else {
        await productsApi.create(payload);
        toast.success('Product created!');
      }
      setIsModalOpen(false);
      fetchAll();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '', category_id: '', main_image: '', additional_images: [],
      original_price: 0, discount_price: 0, stock_quantity: 0,
      description: '', tag: '', is_cod_available: true,
      sizes: [], colors: [], new_arrival_days: 7
    });
  };

  const deleteProduct = async (id: string) => {
    setProductToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await productsApi.delete(productToDelete);
      toast.success('Product deleted');
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    }
    setProductToDelete(null);
    setIsConfirmOpen(false);
  };

  const addSize = () => {
    if (newSize && !formData.sizes.includes(newSize)) {
      setFormData({ ...formData, sizes: [...formData.sizes, newSize] });
      setNewSize('');
    }
  };

  const removeSize = (size: string) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
  };

  const addColor = () => {
    if (newColor && !formData.colors.includes(newColor)) {
      setFormData({ ...formData, colors: [...formData.colors, newColor] });
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-black">Products</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage your inventory and variants</p>
        </div>
        <button 
          onClick={() => {
            setIsEditMode(false);
            setFormData({
              name: '', category_id: '', main_image: '', additional_images: [],
              original_price: 0, discount_price: 0, stock_quantity: 0,
              description: '', tag: '', is_cod_available: true,
              sizes: [], colors: []
            });
            setIsModalOpen(true);
          }}
          className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-gray-900 transition-all active:scale-95 shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Stock</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group-hover:scale-105 transition-transform">
                        <img src={product.main_image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-black">{product.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {product.id.toString().slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {product.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[11px] font-black uppercase tracking-widest text-black">₹{product.discount_price}</p>
                    {product.original_price > product.discount_price && (
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest line-through">₹{product.original_price}</p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${product.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-black">{product.stock_quantity} in stock</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-2.5 text-black bg-white shadow-sm rounded-xl transition-all border border-gray-100 hover:shadow-md active:scale-95"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-2.5 text-red-500 bg-white shadow-sm rounded-xl transition-all border border-gray-100 hover:bg-red-50 hover:shadow-md active:scale-95"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-white w-full h-full sm:h-[90vh] sm:max-w-4xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
                <h3 className="text-sm font-black uppercase tracking-widest">{isEditMode ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 pb-24 sm:pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Name</label>
                      <input 
                        required
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                        <select 
                          required
                          className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                          value={formData.category_id}
                          onChange={e => setFormData({...formData, category_id: e.target.value})}
                        >
                          <option value="">Select</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tagging</label>
                        <select 
                          className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                          value={formData.tag}
                          onChange={e => setFormData({...formData, tag: e.target.value})}
                        >
                          <option value="">None</option>
                          <option value="Premium">Premium</option>
                          <option value="@599">@599</option>
                          <option value="New Arrival">New Arrival</option>
                          <option value="Best Seller">Best Seller</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Original Price</label>
                        <input 
                          type="number"
                          required
                          className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                          value={formData.original_price}
                          onChange={e => setFormData({...formData, original_price: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Discount Price</label>
                        <input 
                          type="number"
                          required
                          className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                          value={formData.discount_price}
                          onChange={e => setFormData({...formData, discount_price: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Quantity</label>
                      <input 
                        type="number"
                        required
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                        value={formData.stock_quantity}
                        onChange={e => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
                      />
                    </div>

                    {role === 'superadmin' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">New Arrival Days</label>
                        <input 
                          type="number"
                          required
                          min="1"
                          max="365"
                          className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                          value={formData.new_arrival_days}
                          onChange={e => setFormData({...formData, new_arrival_days: parseInt(e.target.value)})}
                        />
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Product will stay in "New Arrivals" for this many days.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sizes</label>
                        <div className="flex gap-2">
                          <input 
                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold"
                            value={newSize}
                            onChange={e => setNewSize(e.target.value)}
                            placeholder="e.g. 7, 8, XL"
                          />
                          <button type="button" onClick={addSize} className="bg-black text-white p-2 rounded-xl"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.sizes.map(size => (
                            <span key={size} className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                              {size}
                              <button type="button" onClick={() => removeSize(size)}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Colors</label>
                        <div className="flex gap-2">
                          <input 
                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold"
                            value={newColor}
                            onChange={e => setNewColor(e.target.value)}
                            placeholder="e.g. Black, Red"
                          />
                          <button type="button" onClick={addColor} className="bg-black text-white p-2 rounded-xl"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.colors.map(color => (
                            <span key={color} className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                              {color}
                              <button type="button" onClick={() => removeColor(color)}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Main Image</label>
                        <button 
                          type="button"
                          onClick={handleGenerateImage}
                          disabled={isGenerating || isUploading}
                          className="text-[8px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          {isGenerating ? 'Generating...' : 'AI Generate'}
                        </button>
                      </div>
                      
                      <div className="flex gap-4 items-center">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <label 
                          htmlFor="product-image-upload"
                          className="flex-1 aspect-square sm:aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all overflow-hidden relative group"
                        >
                          {formData.main_image ? (
                            <>
                              <img src={formData.main_image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="w-8 h-8 text-white" />
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-300 mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Click to upload image</p>
                            </>
                          )}
                          {isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                              <RefreshCw className="w-8 h-8 animate-spin text-black" />
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Gallery</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleGalleryUpload}
                            className="hidden"
                            id="gallery-upload"
                          />
                          <label 
                            htmlFor="gallery-upload"
                            className="text-[8px] font-black uppercase tracking-widest text-black hover:opacity-70 flex items-center gap-1 cursor-pointer bg-gray-100 px-3 py-1.5 rounded-full transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            Add Images
                          </label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {formData.additional_images.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                            <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all z-10"
                              title="Remove Image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {isUploadingGallery && (
                          <div className="aspect-square rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
                          </div>
                        )}
                        {formData.additional_images.length === 0 && !isUploadingGallery && (
                          <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">No gallery images</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                      <textarea 
                        required
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold resize-none"
                        rows={5}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-gray-200 text-black focus:ring-black"
                          checked={formData.is_cod_available}
                          onChange={e => setFormData({...formData, is_cod_available: e.target.checked})}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-all">COD Available</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-50 sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none">
                  <button 
                    disabled={loading || isUploading}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/10"
                  >
                    {loading ? 'Processing...' : (isEditMode ? 'Update Product' : 'Create Product')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  );
};

const AdminCategories = ({ addLog }: { addLog: (msg: string) => void }) => {
  const { role, user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    addLog(`Category file selected: ${file.name}`);
    if (!user) {
      addLog('ERROR: No user found. Please log in again.');
      toast.error('Session expired. Please log in again.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Please upload an image under 5MB.');
      return;
    }

    const loadingToast = toast.loading('Uploading category image...');
    setIsUploading(true);
    try {
      addLog('Starting upload to backend...');
      const { data } = await uploadApi.single(file);
      const url = data.url;
      addLog(`Category upload success: ${url}`);
      setImageUrl(url);
      addLog(`State updated with imageUrl: ${url}`);
      toast.success('Image uploaded!', { id: loadingToast });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || JSON.stringify(error);
      addLog(`CATEGORY UPLOAD ERROR: ${errorMsg}`);
      console.error('Category upload error:', error);
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  }, [user, addLog]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await categoriesApi.getAll();
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleEdit = useCallback((category: any) => {
    setName(category.name);
    setImageUrl(category.image_url);
    setDescription(category.description || '');
    setEditingId(category.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    addLog(`Submitting category form. Current imageUrl: "${imageUrl}"`);
    
    if (!imageUrl) {
      addLog('ERROR: No image uploaded. Please upload an image first.');
      toast.error('Please upload an image first.');
      return;
    }

    setLoading(true);
    try {
      addLog(`Payload: ${JSON.stringify({ name, image_url: imageUrl })}`);
      const payload = {
        name,
        image_url: imageUrl,
        description
      };

      if (isEditMode && editingId) {
        await categoriesApi.update(editingId, payload);
        toast.success('Category updated successfully');
      } else {
        await categoriesApi.create(payload);
        toast.success('Category added successfully');
      }
      
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setName('');
      setImageUrl('');
      setDescription('');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  }, [imageUrl, name, description, isEditMode, editingId, fetchCategories, addLog]);

  const deleteCategory = async (id: string) => {
    setCategoryToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await categoriesApi.delete(categoryToDelete);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    }
    setCategoryToDelete(null);
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-black">Categories</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage product collections</p>
        </div>
        <button 
          onClick={() => {
            setIsEditMode(false);
            setName('');
            setImageUrl('');
            setDescription('');
            setIsModalOpen(true);
          }}
          className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-gray-900 transition-all active:scale-95 shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden group shadow-sm flex flex-col items-center p-8 text-center hover:shadow-md transition-all">
            <div className="w-28 h-28 rounded-full overflow-hidden mb-6 border-4 border-gray-50 group-hover:border-black transition-all duration-500 shadow-sm">
              <img src={category.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest mb-2 text-black">{category.name}</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1">{category.description || 'No description'}</p>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => handleEdit(category)} 
                className="p-2.5 text-black bg-white shadow-sm rounded-xl transition-all border border-gray-100 hover:shadow-md active:scale-95"
                title="Edit Category"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => deleteCategory(category.id)} 
                className="p-2.5 text-red-500 bg-white shadow-sm rounded-xl transition-all border border-gray-100 hover:bg-red-50 hover:shadow-md active:scale-95"
                title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
                <h3 className="text-sm font-black uppercase tracking-widest">{isEditMode ? 'Edit Category' : 'Add New Category'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto pb-24 sm:pb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Name</label>
                  <input 
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Image</label>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="cat-image-upload"
                    />
                    <label 
                      htmlFor="cat-image-upload"
                      className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all"
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="h-24 object-contain rounded-lg" />
                      ) : (
                        <>
                          <Plus className="w-6 h-6 text-gray-300 mb-2" />
                          <span className="text-[8px] font-black uppercase mt-2">Upload Image</span>
                        </>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-black" />
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description (Optional)</label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold resize-none"
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-50 sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none">
                  <button 
                    disabled={loading || isUploading}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/10"
                  >
                    {loading ? 'Saving...' : (isEditMode ? 'Update Category' : 'Create Category')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This will also affect products associated with it."
      />
    </div>
  );
};

const AdminSliders = ({ addLog }: { addLog: (msg: string) => void }) => {
  const { role, user } = useAuth();
  const [sliders, setSliders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sliderToDelete, setSliderToDelete] = useState<string | null>(null);
  
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    desktop_banner: '',
    mobile_banner: '',
    category_id: '',
    description: '',
    button_text: 'Shop Now',
    show_button: true,
    show_description: true
  });

  const fetchAll = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        slidersApi.getAll(),
        categoriesApi.getAll()
      ]);
      if (sRes.data) setSliders(sRes.data);
      if (cRes.data) setCategories(cRes.data);
    } catch (error) {
      console.error('Error fetching sliders/categories:', error);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleEdit = (slider: any) => {
    setFormData({
      desktop_banner: slider.desktop_banner,
      mobile_banner: slider.mobile_banner,
      category_id: slider.category_id || '',
      description: slider.description || '',
      button_text: slider.button_text || 'Shop Now',
      show_button: slider.show_button ?? true,
      show_description: slider.show_description ?? true
    });
    setEditingId(slider.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.desktop_banner && !desktopFile) {
      toast.error('Please upload a desktop banner.');
      return;
    }

    setLoading(true);
    try {
      let desktopUrl = formData.desktop_banner;
      let mobileUrl = formData.mobile_banner;

      if (desktopFile) {
        const loadingToast = toast.loading('Uploading desktop banner...');
        const { data } = await uploadApi.single(desktopFile);
        desktopUrl = data.url;
        toast.success('Desktop banner uploaded', { id: loadingToast });
      }

      if (mobileFile) {
        const loadingToast = toast.loading('Uploading mobile banner...');
        const { data } = await uploadApi.single(mobileFile);
        mobileUrl = data.url;
        toast.success('Mobile banner uploaded', { id: loadingToast });
      }

      const payload = {
        ...formData,
        desktop_banner: desktopUrl,
        mobile_banner: mobileUrl
      };

      if (isEditMode && editingId) {
        await slidersApi.update(editingId, payload);
        toast.success('Slider updated successfully');
      } else {
        await slidersApi.create(payload);
        toast.success('Slider added successfully');
      }
      
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setDesktopFile(null);
      setMobileFile(null);
      setFormData({
        desktop_banner: '',
        mobile_banner: '',
        category_id: '',
        description: '',
        button_text: 'Shop Now',
        show_button: true,
        show_description: true
      });
      fetchAll();
    } catch (error: any) {
      console.error('Slider submission error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to save slider');
    } finally {
      setLoading(false);
    }
  };

  const deleteSlider = async (id: string) => {
    setSliderToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sliderToDelete) return;
    try {
      await slidersApi.delete(sliderToDelete);
      toast.success('Slider deleted');
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    }
    setSliderToDelete(null);
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-black">Hero Sliders</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage homepage banners</p>
        </div>
        <button 
          onClick={() => {
            setIsEditMode(false);
            setFormData({
              desktop_banner: '',
              mobile_banner: '',
              category_id: '',
              description: '',
              button_text: 'Shop Now',
              show_button: true,
              show_description: true
            });
            setIsModalOpen(true);
          }}
          className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-gray-900 transition-all active:scale-95 shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Slider</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sliders.map((slider) => (
          <div key={slider.id} className="bg-white rounded-[40px] border border-gray-100 overflow-hidden group shadow-sm hover:shadow-md transition-all">
            <div className="aspect-video relative overflow-hidden">
              <img src={slider.desktop_banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={() => handleEdit(slider)} className="p-3 bg-white/90 backdrop-blur-md rounded-xl text-black hover:bg-white shadow-xl transition-all active:scale-95"><Edit className="w-4 h-4" /></button>
                <button onClick={() => deleteSlider(slider.id)} className="p-3 bg-white/90 backdrop-blur-md rounded-xl text-red-600 hover:bg-white shadow-xl transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-8 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-black">{slider.categories?.name || 'No Category'}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">
                  {slider.show_button ? 'Button Visible' : 'Button Hidden'} • {slider.show_description ? 'Desc Visible' : 'Desc Hidden'}
                </p>
              </div>
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-4 border-white bg-gray-50 flex items-center justify-center text-[9px] font-black shadow-sm" title="Desktop Image">D</div>
                <div className="w-10 h-10 rounded-full border-4 border-white bg-gray-50 flex items-center justify-center text-[9px] font-black shadow-sm" title="Mobile Image">M</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
                <h3 className="text-sm font-black uppercase tracking-widest">{isEditMode ? 'Edit Slider' : 'Add New Slider'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto pb-24 sm:pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Desktop Banner</label>
                    <div 
                      onClick={() => desktopInputRef.current?.click()}
                      className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all overflow-hidden relative group"
                    >
                      {desktopFile || formData.desktop_banner ? (
                        <>
                          <img 
                            src={desktopFile ? URL.createObjectURL(desktopFile) : formData.desktop_banner} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-300 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Desktop Image</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file"
                      ref={desktopInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setDesktopFile(e.target.files?.[0] || null)}
                    />
                    <div className="mt-2">
                      <input 
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-[10px] font-bold focus:ring-2 focus:ring-black"
                        value={formData.desktop_banner}
                        onChange={e => setFormData({...formData, desktop_banner: e.target.value})}
                        placeholder="Or Desktop Image URL"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mobile Banner</label>
                    <div 
                      onClick={() => mobileInputRef.current?.click()}
                      className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all overflow-hidden relative group"
                    >
                      {mobileFile || formData.mobile_banner ? (
                        <>
                          <img 
                            src={mobileFile ? URL.createObjectURL(mobileFile) : formData.mobile_banner} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-300 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mobile Image</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file"
                      ref={mobileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setMobileFile(e.target.files?.[0] || null)}
                    />
                    <div className="mt-2">
                      <input 
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-[10px] font-bold focus:ring-2 focus:ring-black"
                        value={formData.mobile_banner}
                        onChange={e => setFormData({...formData, mobile_banner: e.target.value})}
                        placeholder="Or Mobile Image URL"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assign Category</label>
                    <select 
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                      value={formData.category_id}
                      onChange={e => setFormData({...formData, category_id: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Button Text</label>
                    <input 
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold"
                      value={formData.button_text}
                      onChange={e => setFormData({...formData, button_text: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description (Optional)</label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black font-bold resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-200 text-black focus:ring-black"
                      checked={formData.show_button}
                      onChange={e => setFormData({...formData, show_button: e.target.checked})}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-all">Show Button</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-200 text-black focus:ring-black"
                      checked={formData.show_description}
                      onChange={e => setFormData({...formData, show_description: e.target.checked})}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-all">Show Desc</span>
                  </label>
                </div>

                <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-50 sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none">
                  <button 
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/10"
                  >
                    {loading ? 'Saving...' : (isEditMode ? 'Update Slider' : 'Create Slider')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Slider"
        message="Are you sure you want to delete this slider? This will remove it from the homepage."
      />
    </div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchOrderItems = async (orderId: string) => {
    setLoadingItems(true);
    try {
      const { data } = await ordersApi.getItems(orderId);
      setOrderItems(data || []);
    } catch (err: any) {
      toast.error('Failed to fetch items: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderItems(selectedOrder.id);
    } else {
      setOrderItems([]);
    }
  }, [selectedOrder]);

  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const exportOrders = () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error('Please select date range');
      return;
    }
    
    const filtered = orders.filter(o => {
      const date = new Date(o.created_at).toISOString().split('T')[0];
      return date >= dateRange.start && date <= dateRange.end;
    });

    if (filtered.length === 0) {
      toast.error('No orders in this range');
      return;
    }

    const csv = [
      ['Order ID', 'Date', 'Customer', 'Email', 'Amount', 'Status', 'Payment'],
      ...filtered.map(o => [
        o.id,
        new Date(o.created_at).toLocaleDateString(),
        o.full_name,
        o.email,
        o.total_amount,
        o.status,
        o.payment_method
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `orders_${dateRange.start}_to_${dateRange.end}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await ordersApi.getAll();
      if (data) setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      toast.success(`Order ${status}`);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Packed': return 'bg-blue-100 text-blue-700';
      case 'Shipped': return 'bg-indigo-100 text-indigo-700';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest">Orders</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage customer purchases</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-4">
            <span className="text-[8px] font-black uppercase text-gray-400">From</span>
            <input 
              type="date" 
              className="text-[10px] font-bold border-none p-0 focus:ring-0"
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          <div className="w-px h-4 bg-gray-100" />
          <div className="flex items-center gap-2 px-4">
            <span className="text-[8px] font-black uppercase text-gray-400">To</span>
            <input 
              type="date" 
              className="text-[10px] font-bold border-none p-0 focus:ring-0"
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <button 
            onClick={exportOrders}
            className="bg-black text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
          >
            Export CSV
          </button>
          <button onClick={fetchOrders} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="group hover:bg-gray-50/50 transition-all">
                  <td className="px-8 py-6">
                    <span className="text-xs font-black uppercase tracking-widest">#{order.id.toString().slice(0, 8)}</span>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black uppercase tracking-widest">{order.users?.full_name || 'Guest'}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{order.users?.email}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black">₹{order.total_amount}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{order.payment_method}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`text-[10px] font-black uppercase tracking-widest border-none rounded-full px-4 py-2 focus:ring-0 cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:opacity-50 transition-all"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-sm font-black uppercase tracking-widest">Order Details</h3>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white rounded-xl transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Details</label>
                    <p className="text-xs font-black uppercase">{selectedOrder.users?.full_name}</p>
                    <p className="text-xs font-bold text-gray-500">{selectedOrder.users?.email}</p>
                    <p className="text-xs font-bold text-gray-500">{selectedOrder.users?.phone}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shipping Address</label>
                    <p className="text-xs font-bold text-gray-500 leading-relaxed">
                      {selectedOrder.users?.address}<br />
                      {selectedOrder.users?.state} - {selectedOrder.users?.pincode}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Items</label>
                  <div className="space-y-3">
                    {loadingItems ? (
                      <div className="flex justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-gray-300" />
                      </div>
                    ) : orderItems.length === 0 ? (
                      <p className="text-xs font-bold text-gray-400 text-center py-4">No items found</p>
                    ) : (
                      orderItems.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <img 
                              src={item.products?.main_image} 
                              alt="" 
                              className="w-12 h-12 bg-white rounded-xl border border-gray-100 object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-[10px] font-black uppercase">{item.products?.name}</p>
                              <p className="text-[8px] font-bold text-gray-400 uppercase">
                                Qty: {item.quantity} • Size: {item.size || 'N/A'} • Color: {item.color || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs font-black">₹{item.price * item.quantity}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Status</p>
                    <p className="text-xs font-black uppercase mt-1">{selectedOrder.payment_status || 'Paid'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Amount</p>
                    <p className="text-2xl font-black mt-1">₹{selectedOrder.total_amount}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await notificationsApi.getAll();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to update notification');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      toast.success('Notification removed');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await notificationsApi.deleteAll();
      toast.success('All notifications cleared');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'ORDER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'CANCELLATION':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'STOCK_ALERT':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'REGISTRATION':
        return 'bg-brand-pink-light/40 text-brand-pink border-brand-pink/10';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-3xl border border-brand-pink/5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-brand-brown font-serif">Notification Center</h2>
          <p className="text-xs text-neutral-400 mt-1">Real-time business alerts, stock levels, and order track logs</p>
        </div>
        <div className="flex gap-3">
          {notifications.length > 0 && (
            <>
              <button 
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-brand-pink-light/40 text-brand-pink border border-brand-pink/10 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand-pink/10 transition-colors"
              >
                Mark All Read
              </button>
              <button 
                onClick={handleClearAll}
                className="px-4 py-2 bg-neutral-50 text-neutral-400 border border-neutral-100 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-100 hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-pink" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-brand-pink/5 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-brand-pink-light/30 text-brand-pink rounded-full flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-brand-brown font-serif">No new notifications</p>
          <p className="text-xs text-neutral-400 leading-relaxed">Your store is running smoothly! All registrations, orders, and stock indicators will appear here in real-time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notifications.map((n: any) => (
            <div 
              key={n.id} 
              className={`p-6 bg-white border rounded-2xl shadow-xs transition-all flex items-start gap-4 ${!n.read ? 'border-brand-pink/10 bg-brand-pink-light/5' : 'border-neutral-100 opacity-80 hover:opacity-100'}`}
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${getBadgeStyle(n.type)}`}>
                    {n.type}
                  </span>
                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
                  )}
                  <span className="text-[10px] font-bold text-neutral-400 ml-auto">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-brand-brown font-serif">{n.title}</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">{n.message}</p>
              </div>

              <div className="flex gap-2 self-center">
                {!n.read && (
                  <button 
                    onClick={() => handleMarkRead(n.id)}
                    className="p-2 text-brand-pink hover:bg-brand-pink-light rounded-lg transition-colors text-xs font-bold"
                    title="Mark as Read"
                  >
                    Mark Read
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(n.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                  title="Delete Alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

