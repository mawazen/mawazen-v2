import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Scale, Sparkles, Eye, EyeOff, Mail, User, Shield, Chrome } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/_core/firebase";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string>("");
  const backendOrigin = import.meta.env.VITE_BACKEND_ORIGIN ?? "";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error === "email") {
      setServerError("هذا البريد الإلكتروني مستخدم بالفعل.");
    } else if (error === "phone") {
      setServerError("هذا رقم الجوال مستخدم بالفعل.");
    } else {
      setServerError("");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[Login] Submitting form with data:', { name: formData.name, email: formData.email });

    try {
      // Create a form element and submit it to handle the redirect properly
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${backendOrigin}/api/local-login`;
      
      // Add form data
      const nameField = document.createElement('input');
      nameField.type = 'hidden';
      nameField.name = 'name';
      nameField.value = formData.name;
      form.appendChild(nameField);
      
      const emailField = document.createElement('input');
      emailField.type = 'hidden';
      emailField.name = 'email';
      emailField.value = formData.email;
      form.appendChild(emailField);
      
      const passwordField = document.createElement('input');
      passwordField.type = 'hidden';
      passwordField.name = 'password';
      passwordField.value = formData.password;
      form.appendChild(passwordField);
      
      console.log('[Login] Submitting form to:', form.action);
      
      // Submit the form
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (serverError) setServerError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
      const url = apiBase ? `${apiBase}/api/auth/firebase` : "/api/auth/firebase";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const message = data?.message || "فشل تسجيل الدخول بواسطة Google";
        throw new Error(message);
      }

      const token = data?.data?.token;
      if (typeof token !== "string" || !token) {
        throw new Error("فشل تسجيل الدخول بواسطة Google");
      }

      localStorage.setItem("auth_token", token);
      setLocation("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      setServerError(error instanceof Error ? error.message : "فشل تسجيل الدخول بواسطة Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  console.log('[Login] Login page rendered');

  return (
    <div className="container py-12 lg:py-16">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="hidden lg:block">
          <div className="glass h-full rounded-3xl p-10">
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 overflow-hidden rounded-2xl border border-border/60 bg-card/60">
                <img src="/logo.png" alt="موازين" className="h-full w-full object-cover" />
              </span>
              <div>
                <div className="text-xl font-extrabold text-gold-gradient">موازين</div>
                <div className="text-sm text-muted-foreground">تجربة Premium لإدارة العمل القانوني</div>
              </div>
            </div>

            <div className="mt-10 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-gold" />
                <div>مساعد ذكي متخصص في الأنظمة السعودية للبحث والصياغة والتحليل.</div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-gold" />
                <div>أمان وصلاحيات وتنظيم كامل للقضايا والمستندات والفواتير.</div>
              </div>
              <div className="flex items-start gap-3">
                <Scale className="mt-0.5 h-5 w-5 text-gold" />
                <div>واجهة عربية احترافية بتجربة استخدام سريعة ومريحة.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-gold rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">تسجيل الدخول</h1>
              <p className="mt-1 text-sm text-muted-foreground">ادخل لحسابك وابدأ العمل فورًا</p>
            </div>
            <span className="h-12 w-12 overflow-hidden rounded-2xl border border-border/60 bg-card/60 lg:hidden">
              <img src="/logo.png" alt="موازين" className="h-full w-full object-cover" />
            </span>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="glass w-full rounded-2xl px-4 py-3 text-sm font-semibold text-foreground hover:border-gold/40"
            >
              <span className="flex items-center justify-center gap-2">
                <Chrome className="h-4 w-4" />
                {googleLoading ? "جاري تسجيل الدخول..." : "متابعة باستخدام Google"}
              </span>
            </button>
          </div>

          {serverError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                className="glass w-full rounded-2xl px-4 py-3 text-right"
                dir="rtl"
              />
            </div>

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
                className="glass w-full rounded-2xl px-4 py-3 text-right"
                dir="rtl"
              />
            </div>

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
                  className="glass w-full rounded-2xl px-4 py-3 pr-10 text-right"
                  dir="rtl"
                />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-gold w-full rounded-2xl px-4 py-3 text-sm font-semibold"
              disabled={isLoading}
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    تسجيل الدخول
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ليس لديك حساب؟{" "}
              <button onClick={() => setLocation('/signup')} className="text-gold hover:text-gold/80 font-medium">
                إنشاء حساب جديد
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
