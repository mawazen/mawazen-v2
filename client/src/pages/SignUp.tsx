import { useState } from "react";
import { useLocation } from "wouter";
import { Scale, Sparkles, Eye, EyeOff, Mail, User, Shield, Phone, Building } from "lucide-react";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    lawFirm: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[SignUp] Submitting form with data:', { 
      name: formData.name, 
      email: formData.email,
      phone: formData.phone,
      lawFirm: formData.lawFirm
    });

    try {
      // For now, redirect to login with a success message
      // In the future, this would create a new user account
      setTimeout(() => {
        setLocation('/login?message=account_created');
      }, 1500);
      
    } catch (error) {
      console.error("Sign up error:", error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  console.log('[SignUp] Sign up page rendered');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-background to-background" />
      
      <div className="relative w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
            <Scale className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="text-gold">قيد</span>
          </h1>
          <p className="text-muted-foreground">انضم إلى نظام إدارة القضايا القانونية المتقدم</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
          <div className="text-center pb-4">
            <h2 className="text-2xl font-bold text-foreground">إنشاء حساب جديد</h2>
            <p className="text-muted-foreground text-sm mt-2">
              ابدأ رحلتك مع نظام قيد لإدارة القضايا
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-right flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                الاسم الكامل
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg text-right"
                dir="rtl"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-right flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg text-right"
                dir="rtl"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-right flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4" />
                رقم الهاتف
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="أدخل رقم هاتفك"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg text-right"
                dir="rtl"
              />
            </div>

            {/* Law Firm Field */}
            <div className="space-y-2">
              <label htmlFor="lawFirm" className="text-right flex items-center gap-2 text-sm font-medium">
                <Building className="h-4 w-4" />
                اسم المكتب أو الشركة
              </label>
              <input
                id="lawFirm"
                name="lawFirm"
                type="text"
                placeholder="اسم مكتب المحاماة أو الشركة"
                value={formData.lawFirm}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg text-right"
                dir="rtl"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-right flex items-center gap-2 text-sm font-medium">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 pr-10 border rounded-lg text-right"
                  dir="rtl"
                />
                <button
                  type="button"
                  className="absolute left-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                  جاري إنشاء الحساب...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  إنشاء حساب جديد
                </div>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <button 
                onClick={() => setLocation('/login')}
                className="text-gold hover:text-gold/80 font-medium"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-gold/5 rounded-lg border border-gold/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium mb-1">
                  أمان وموثوقية
                </p>
                <p className="text-xs text-muted-foreground">
                  بياناتك محمية بأحدث تقنيات التشفير والخصوصية
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            © 2024 قيد. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
}
