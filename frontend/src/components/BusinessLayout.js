import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  ChefHat,
  Warehouse,
  Building2,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  Calculator,
  Receipt,
  Star,
  Calendar,
  Truck,
  ShoppingBag,
  Clock,
  Fingerprint,
  Coffee,
  Heart,
  Pill,
  Store,
  Globe,
  Utensils,
  MousePointer,
  CreditCard,
  AlertTriangle,
  Barcode
} from 'lucide-react';

const BusinessLayout = () => {
  const { user, logout } = useAuth();
  const { t, direction, isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // تحديد نوع العمل من اسم المستخدم
  const getBusinessType = () => {
    if (!user || !user.username) return 'restaurant';
    
    const username = user.username.toLowerCase();
    
    if (username.includes('cafe')) return 'cafe';
    if (username.includes('supermarket')) return 'supermarket';
    if (username.includes('pharmacy')) return 'pharmacy';
    if (username.includes('retail')) return 'retail';
    if (username.includes('ecommerce')) return 'ecommerce';
    if (username.includes('restaurant')) return 'restaurant';
    
    return 'restaurant';
  };

  const businessType = getBusinessType();

  // قوائم مختلفة لكل نوع عمل
  const getMenuItems = () => {
    const commonItems = [
      { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
      { path: '/pos', icon: Calculator, label: t('pos') },
    ];

    switch (businessType) {
      case 'cafe':
        return [
          ...commonItems,
          { path: '/drinks', icon: Coffee, label: t('drinks') },
          { path: '/orders', icon: ShoppingCart, label: t('orders') },
          { path: '/loyalty', icon: Star, label: t('loyaltyProgram') },
          { path: '/customers', icon: Users, label: t('customers') },
          { path: '/inventory', icon: Warehouse, label: t('inventory') },
          { path: '/employees', icon: Users, label: t('employees') },
          { path: '/reports', icon: BarChart3, label: t('reports') },
          { path: '/notifications', icon: Bell, label: t('notifications') },
        ];

      case 'supermarket':
        return [
          ...commonItems,
          { path: '/products', icon: Package, label: t('products') },
          { path: '/inventory', icon: Warehouse, label: t('inventory') },
          { path: '/barcode', icon: Barcode, label: t('barcode') },
          { path: '/categories', icon: ShoppingBag, label: t('categories') },
          { path: '/suppliers', icon: Truck, label: t('suppliers') },
          { path: '/orders', icon: ShoppingCart, label: t('orders') },
          { path: '/customers', icon: Users, label: t('customers') },
          { path: '/employees', icon: Users, label: t('employees') },
          { path: '/reports', icon: BarChart3, label: t('reports') },
          { path: '/alerts', icon: AlertTriangle, label: t('alerts') },
        ];

      case 'pharmacy':
        return [
          ...commonItems,
          { path: '/medicines', icon: Pill, label: t('medicines') },
          { path: '/prescriptions', icon: Heart, label: t('prescriptions') },
          { path: '/inventory', icon: Warehouse, label: t('inventory') },
          { path: '/expiry', icon: Calendar, label: t('expiry') },
          { path: '/customers', icon: Users, label: t('customers') },
          { path: '/suppliers', icon: Truck, label: t('suppliers') },
          { path: '/employees', icon: Users, label: t('employees') },
          { path: '/reports', icon: BarChart3, label: t('reports') },
          { path: '/notifications', icon: Bell, label: t('notifications') },
        ];

      case 'retail':
        return [
          ...commonItems,
          { path: '/products', icon: Package, label: t('products') },
          { path: '/inventory', icon: Warehouse, label: t('inventory') },
          { path: '/customers', icon: Users, label: t('customers') },
          { path: '/orders', icon: ShoppingCart, label: t('sales') },
          { path: '/payments', icon: CreditCard, label: t('payments') },
          { path: '/loyalty', icon: Star, label: t('loyaltyProgram') },
          { path: '/employees', icon: Users, label: t('employees') },
          { path: '/branches', icon: Building2, label: t('branches') },
          { path: '/reports', icon: BarChart3, label: t('reports') },
        ];

      case 'ecommerce':
        return [
          ...commonItems,
          { path: '/products', icon: Package, label: t('products') },
          { path: '/orders', icon: ShoppingCart, label: t('orders') },
          { path: '/customers', icon: Users, label: t('customers') },
          { path: '/website', icon: Globe, label: t('website') },
          { path: '/analytics', icon: MousePointer, label: t('analytics') },
          { path: '/shipping', icon: Truck, label: t('shipping') },
          { path: '/payments', icon: CreditCard, label: t('payments') },
          { path: '/inventory', icon: Warehouse, label: t('inventory') },
          { path: '/reports', icon: BarChart3, label: t('reports') },
        ];

      case 'restaurant':
      default:
        return [
          ...commonItems,
          { path: '/orders', icon: ShoppingCart, label: t('orders') },
          { path: '/kitchen', icon: ChefHat, label: t('kitchen') },
          { path: '/menu', icon: Utensils, label: t('menu') },
          { path: '/tables', icon: Calendar, label: t('tables') },
          { path: '/reservations', icon: Calendar, label: t('reservations') },
          { path: '/delivery', icon: Truck, label: t('delivery') },
          { path: '/customers', icon: Users, label: t('customers') },
          { path: '/employees', icon: Users, label: t('employees') },
          { path: '/inventory', icon: Warehouse, label: t('inventory') },
          { path: '/reports', icon: BarChart3, label: t('reports') },
        ];
    }
  };

  // معلومات العمل حسب النوع
  const getBusinessInfo = () => {
    switch (businessType) {
      case 'cafe':
        return {
          name: t('cafeName'),
          description: t('cafeDesc'),
          color: 'from-amber-500 to-orange-600',
          icon: Coffee
        };
      case 'supermarket':
        return {
          name: t('supermarketName'),
          description: t('supermarketDesc'),
          color: 'from-green-500 to-emerald-600',
          icon: ShoppingCart
        };
      case 'pharmacy':
        return {
          name: t('pharmacyName'),
          description: t('pharmacyDesc'),
          color: 'from-red-500 to-pink-600',
          icon: Heart
        };
      case 'retail':
        return {
          name: t('retailName'),
          description: t('retailDesc'),
          color: 'from-purple-500 to-indigo-600',
          icon: Store
        };
      case 'ecommerce':
        return {
          name: t('ecommerceName'),
          description: t('ecommerceDesc'),
          color: 'from-blue-500 to-cyan-600',
          icon: Globe
        };
      case 'restaurant':
      default:
        return {
          name: t('restaurantName'),
          description: t('restaurantDesc'),
          color: 'from-orange-500 to-red-600',
          icon: Utensils
        };
    }
  };

  const menuItems = getMenuItems();
  const businessInfo = getBusinessInfo();
  const BusinessIcon = businessInfo.icon;

  return (
    <div className="min-h-screen flex" dir={direction}>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/50 transition-all duration-500 ease-in-out flex flex-col fixed h-full z-50 lg:relative ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } backdrop-blur-xl shadow-2xl`}
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 50%, rgba(17, 24, 39, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Logo & Toggle */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/images/logo.png" 
                  alt={businessInfo.name} 
                  className="w-10 h-10 rounded-xl object-cover shadow-lg ring-2 ring-white/20"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-gray-900"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{businessInfo.name}</h1>
                <p className="text-xs text-gray-400">{businessInfo.description}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-10 h-10 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300 backdrop-blur-sm"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all duration-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === `/app${item.path}`;
              
              return (
                <Link
                  key={item.path}
                  to={`/app${item.path}`}
                  className={`sidebar-item group relative ${
                    isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                  } mx-2 my-1`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isActive && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-full"></div>
                  )}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 shadow-lg' 
                      : 'group-hover:bg-white/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`} />
                  </div>
                  {sidebarOpen && (
                    <span className={`flex-1 font-medium transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                    }`}>
                      {item.label}
                    </span>
                  )}
                  {isActive && sidebarOpen && (
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-4 mt-auto">
          {sidebarOpen ? (
            <div className="mb-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-12 h-12 bg-gradient-to-br ${businessInfo.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-gray-900"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user?.full_name || 'المدير'}</p>
                  <p className="text-xs text-gray-400 truncate">{businessInfo.name}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className={`w-12 h-12 bg-gradient-to-br ${businessInfo.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-gray-900"></div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 mx-2"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl group-hover:bg-red-500/20 transition-all duration-300">
              <LogOut className="w-5 h-5" />
            </div>
            {sidebarOpen && <span className="flex-1 font-medium">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 lg:px-6 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
            >
              <Menu size={20} />
            </button>

            <Link
              to="/app/dashboard"
              className="flex items-center justify-center w-10 h-10"
            >
              <img
                src="/images/logo.png"
                alt={businessInfo.name}
                className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-gray-200"
              />
            </Link>
            
            <div className="relative hidden sm:block">
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type="text"
                placeholder={isRTL ? `البحث في ${businessInfo.name}...` : `Search in ${businessInfo.name}...`}
                className={`w-80 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 backdrop-blur-sm transition-all duration-300 hover:bg-white`}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageToggle />
            
            <button className="relative flex items-center justify-center w-12 h-12 text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-300 hover:scale-105 group">
              <Bell size={20} />
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                3
              </span>
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </button>
            
            <div className="hidden sm:flex items-center gap-3 pl-4 border-r border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {new Date().toLocaleDateString('ar-SA', { weekday: 'long' })}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className={`w-10 h-10 bg-gradient-to-br ${businessInfo.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-sm">
                  {new Date().getDate()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
          <div className="p-6 md:p-8 mx-auto max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BusinessLayout;
