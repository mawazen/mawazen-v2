import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Scale,
  Sparkles,
  Eye,
  EyeOff,
  Mail,
  User,
  Shield,
  Phone,
  Building,
  CheckCircle2,
} from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/_core/firebase";

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M20 6.5V18a2 2 0 0 1-2 2h-2V10.5L12 13.5 8 10.5V20H6a2 2 0 0 1-2-2V6.5A2.5 2.5 0 0 1 6.5 4h.5l5 3.75L17 4h.5A2.5 2.5 0 0 1 20 6.5Z"
        opacity="0.15"
      />
      <path
        fill="#EA4335"
        d="M6 20a2 2 0 0 1-2-2V6.5A2.5 2.5 0 0 1 6.5 4H6v16Z"
      />
      <path
        fill="#34A853"
        d="M18 20a2 2 0 0 0 2-2V6h-.5A2.5 2.5 0 0 0 17 4h-1v16Z"
      />
      <path
        fill="#4285F4"
        d="M12 13.5 16 10.5V4l-4 3-4-3v6.5l4 3Z"
      />
      <path
        fill="#FBBC05"
        d="M8 4v6.5l4 3 4-3V4l-4 3-4-3Z"
        opacity="0.7"
      />
    </svg>
  );
}

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupMode, setSignupMode] = useState<"trial" | "pay">("trial");
  const [serverError, setServerError] = useState<string>("");
  const backendOrigin = import.meta.env.VITE_BACKEND_ORIGIN ?? "";
  type AccountType = "individual" | "law_firm" | "enterprise";
  const planDetails: Record<AccountType, { name: string; features: string[] }> = {
    individual: {
      name: "فردي",
      features: [
        "عدد المستخدمين: 1",
        "مساعد قانوني ذكي متخصص في الأنظمة السعودية",
        "تحليل القضايا والاستشارات وصياغة المستندات حسب الاستخدام العادل",
        "تفعيل الاشتراك في بيئة الإنتاج يتم عبر القنوات المعتمدة",
      ],
    },
    law_firm: {
      name: "مكتب محاماة",
      features: [
        "عدد المستخدمين: 5",
        "إدارة الفريق والصلاحيات داخل النظام",
        "مساعد قانوني ذكي متخصص في الأنظمة السعودية",
        "تحليل القضايا والاستشارات وصياغة المستندات حسب الاستخدام العادل",
        "تفعيل الاشتراك في بيئة الإنتاج يتم عبر القنوات المعتمدة",
      ],
    },
    enterprise: {
      name: "منشأة",
      features: [
        "عدد المستخدمين: 15",
        "إدارة الفريق والصلاحيات داخل النظام",
        "مساعد قانوني ذكي متخصص في الأنظمة السعودية",
        "تحليل القضايا والاستشارات وصياغة المستندات حسب الاستخدام العادل",
        "تفعيل الاشتراك في بيئة الإنتاج يتم عبر القنوات المعتمدة",
      ],
    },
  };

  const normalizePhone = (raw: string) => {
    const v = (raw ?? "").trim();
    if (!v) return "";
    if (v.startsWith("+")) return v;
    return v;
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    lawFirm: "",
    accountType: "individual" as "individual" | "law_firm" | "enterprise",
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    if (mode === "trial" || mode === "pay") {
      setSignupMode(mode);
    }

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
    console.log('[SignUp] Submitting form with data:', { 
      name: formData.name, 
      email: formData.email,
      phone: formData.phone,
      lawFirm: formData.lawFirm,
      accountType: formData.accountType,
    });

    try {
      const auth = await getFirebaseAuth();
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(result.user, { displayName: formData.name });

      await sendEmailVerification(result.user);

      const idToken = await result.user.getIdToken();

      const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
      const url = apiBase ? `${apiBase}/api/auth/firebase` : "/api/auth/firebase";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          profile: {
            name: formData.name,
            phone: normalizePhone(formData.phone),
            organizationName: formData.lawFirm,
          },
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        if (res.status === 403 && data?.code === "EMAIL_NOT_VERIFIED") {
          await signOut(auth);
          setServerError("تم إنشاء الحساب. تم إرسال رسالة تفعيل إلى بريدك — فعّل البريد ثم سجّل الدخول.");
          return;
        }

        const message = data?.message || "فشل إنشاء الحساب";
        throw new Error(message);
      }

      const token = data?.data?.token;
      if (typeof token !== "string" || !token) {
        throw new Error("فشل إنشاء الحساب");
      }

      localStorage.setItem("auth_token", token);

      const redirectTarget =
        signupMode === "pay"
          ? `/payments?plan=${encodeURIComponent(formData.accountType)}`
          : "/dashboard";
      setLocation(redirectTarget);
    } catch (error) {
      console.error("Sign up error:", error);
      setServerError(error instanceof Error ? error.message : "فشل إنشاء الحساب");
    } finally {
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

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);

    try {
      const auth = await getFirebaseAuth();
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
        body: JSON.stringify({
          idToken,
          profile: {
            name: formData.name,
            phone: formData.phone,
            organizationName: formData.lawFirm,
          },
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const message = data?.message || "فشل إنشاء الحساب بواسطة Google";
        throw new Error(message);
      }

      const token = data?.data?.token;
      if (typeof token !== "string" || !token) {
        throw new Error("فشل إنشاء الحساب بواسطة Google");
      }

      localStorage.setItem("auth_token", token);

      const redirectTarget =
        signupMode === "pay"
          ? `/payments?plan=${encodeURIComponent(formData.accountType)}`
          : "/dashboard";

      setLocation(redirectTarget);
    } catch (error) {
      console.error("Google signup error:", error);
      const err = error as any;
      if (err?.code === "auth/unauthorized-domain") {
        const host = typeof window !== "undefined" ? window.location.hostname : "";
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        setServerError(
          `الدومين غير مُصرّح به في Firebase: ${host || origin}. أضف هذا الدومين إلى Authorized domains ثم أعد المحاولة.`
        );
      } else {
        setServerError(error instanceof Error ? error.message : "فشل إنشاء الحساب بواسطة Gmail");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  console.log('[SignUp] Sign up page rendered');

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
                <div className="text-sm text-muted-foreground">ابدأ تجربة Premium الآن</div>
              </div>
            </div>

            <div className="mt-10 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-gold" />
                <div>تهيئة سريعة، ولوحة تحكم وتنظيم كامل للقضايا والمهام.</div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-gold" />
                <div>مساعد ذكي للصياغة والبحث والتحليل ضمن سير عمل واضح.</div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-gold" />
                <div>أمان وخصوصية وصلاحيات مناسبة للمكتب أو المنشأة.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-gold rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">إنشاء حساب جديد</h1>
              <p className="mt-1 text-sm text-muted-foreground">اختر الخطة وابدأ خلال دقائق</p>
            </div>
            <span className="h-12 w-12 overflow-hidden rounded-2xl border border-border/60 bg-card/60 lg:hidden">
              <img src="/logo.png" alt="موازين" className="h-full w-full object-cover" />
            </span>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="glass w-full rounded-2xl px-4 py-3 text-sm font-semibold text-foreground hover:border-gold/40"
            >
              <span className="flex items-center justify-center gap-2">
                <GmailIcon className="h-4 w-4" />
                {googleLoading ? "جاري إنشاء الحساب..." : "تسجيل بواسطة Gmail"}
              </span>
            </button>
          </div>

          <div className="mt-3">
            <div className="text-center text-xs text-muted-foreground">
              أو
            </div>
          </div>

          {serverError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          ) : null}

          <div className="mt-5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSignupMode('trial')}
                className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                  signupMode === 'trial'
                    ? 'bg-gold text-black border-gold'
                    : 'bg-transparent text-foreground border-border/60 hover:border-gold/50'
                }`}
              >
                فترة تجريبية مجانية
              </button>
              <button
                type="button"
                onClick={() => setSignupMode('pay')}
                className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                  signupMode === 'pay'
                    ? 'bg-gold text-black border-gold'
                    : 'bg-transparent text-foreground border-border/60 hover:border-gold/50'
                }`}
              >
                الدفع الآن
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Account Type / Plan */}
            <div className="space-y-2">
              <label className="text-right flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" />
                نوع الحساب
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: "individual" })}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.accountType === "individual"
                      ? 'bg-gold text-black border-gold'
                      : 'bg-transparent text-foreground border-border/60 hover:border-gold/50'
                  }`}
                >
                  فردي
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: "law_firm" })}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.accountType === "law_firm"
                      ? 'bg-gold text-black border-gold'
                      : 'bg-transparent text-foreground border-border/60 hover:border-gold/50'
                  }`}
                >
                  مكتب محاماة
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: "enterprise" })}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.accountType === "enterprise"
                      ? 'bg-gold text-black border-gold'
                      : 'bg-transparent text-foreground border-border/60 hover:border-gold/50'
                  }`}
                >
                  منشأة
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                حد المستخدمين: {formData.accountType === "law_firm" ? "5" : formData.accountType === "enterprise" ? "15" : "1"}
              </p>

              <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                <p className="text-sm font-medium text-foreground text-right mb-2">
                  مميزات باقة {planDetails[formData.accountType].name}
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {planDetails[formData.accountType].features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                      <span className="text-right">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

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
                className="glass w-full rounded-2xl px-4 py-3 text-right"
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
                className="glass w-full rounded-2xl px-4 py-3 text-right"
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
                className="glass w-full rounded-2xl px-4 py-3 text-right"
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
                className="glass w-full rounded-2xl px-4 py-3 text-right"
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
                  className="glass w-full rounded-2xl px-4 py-3 pr-10 text-right"
                  dir="rtl"
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2"
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
              className="btn-gold w-full rounded-2xl px-4 py-3 text-sm font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                  {signupMode === 'pay' ? 'جاري إنشاء الحساب والانتقال للدفع...' : 'جاري إنشاء الحساب...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {signupMode === 'pay' ? 'إنشاء حساب والدفع الآن' : 'إنشاء حساب (تجربة مجانية)'}
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
        </div>
      </div>
    </div>
  );
}
