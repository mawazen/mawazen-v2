import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff, LogIn, ArrowRight, Building2, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const LoginSimple = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginData = {
        username: formData.email, // Backend accepts email as username
        password: formData.password
      };
      
      const response = await api.post('/auth/login', loginData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        toast.success('مرحباً بك! تم تسجيل الدخول بنجاح');
        navigate('/app/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('تم تسجيل الدخول بواسطة Google بنجاح');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'فشل تسجيل الدخول بواسطة Google'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <div className="hidden lg:block">
          <div className="text-center lg:text-right">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Building2 className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">إدارة الأعمال</h1>
                <p className="text-gray-600">نظام شامل لجميع الأعمال التجارية</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              مرحباً بعودتك!
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              ادخل إلى نظام إدارة أعمالك الشامل واستمتع بتجربة إدارة متطورة وسهلة الاستخدام
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
            
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Building2 className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">إدارة الأعمال</h1>
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الدخول</h2>
              <p className="text-gray-600">أدخل بياناتك للوصول إلى حسابك</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم المستخدم أو البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input pr-12"
                    placeholder="اسم المستخدم أو البريد الإلكتروني"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input pr-12 pl-12"
                    placeholder="كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <span className="mr-2 text-sm text-gray-700">تذكرني</span>
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-4 text-lg font-bold group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <>
                    تسجيل الدخول
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full py-4 text-lg font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-700 border-t-transparent"></div>
                    جاري تسجيل الدخول بـ Google...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.613 32.91 29.188 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.97 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                      <path fill="#4CAF50" d="M24 44c5.082 0 9.793-1.946 13.312-5.121l-6.146-5.198C29.104 35.168 26.676 36 24 36c-5.166 0-9.577-3.066-11.282-7.438l-6.521 5.025C9.522 39.556 16.23 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.812 2.29-2.394 4.23-4.137 5.681l.003-.002 6.146 5.198C36.69 39.364 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"/>
                    </svg>
                    تسجيل الدخول بواسطة Google
                  </div>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                ليس لديك حساب؟{' '}
                <Link 
                  to="/register" 
                  className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>

            {/* Business Demo Accounts */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
              <h4 className="font-bold text-blue-900 text-sm mb-3">🚀 حسابات تجريبية للأعمال:</h4>
              
              {/* Create All Business Accounts Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await api.post('/auth/create-business-demos');
                      if (response.data.success) {
                        toast.success('تم إنشاء جميع الحسابات التجريبية بنجاح!');
                        console.log('Business accounts created:', response.data);
                      }
                    } catch (error) {
                      console.error('Create business demos error:', error);
                      toast.error('خطأ في إنشاء الحسابات التجريبية');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-600 transition-all"
                >
                  إنشاء جميع الحسابات التجريبية
                </button>
              </div>

              {/* Business Account Options */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'restaurant_demo', password: 'demo123' })}
                  className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-2 rounded-lg transition-colors"
                >
                  🍽️ مطعم
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'cafe_demo', password: 'demo123' })}
                  className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-lg transition-colors"
                >
                  ☕ كافيه
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'supermarket_demo', password: 'demo123' })}
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-lg transition-colors"
                >
                  🛒 سوبر ماركت
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'pharmacy_demo', password: 'demo123' })}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-lg transition-colors"
                >
                  💊 صيدلية
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'retail_demo', password: 'demo123' })}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-lg transition-colors"
                >
                  🏪 محل تجاري
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'ecommerce_demo', password: 'demo123' })}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg transition-colors"
                >
                  🌐 تجارة إلكترونية
                </button>
              </div>

              <div className="text-xs text-gray-600 mb-3">
                <p><strong>كلمة المرور لجميع الحسابات:</strong> demo123</p>
              </div>
            </div>
          </div>

          {/* Back to Landing */}
          <div className="text-center mt-6">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSimple;
