import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Scale, Sparkles, Eye, EyeOff, Mail, User, Shield } from "lucide-react";
import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
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

  const apiUrl = useMemo(() => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
    return apiBase ? `${apiBase}/api/auth/firebase` : "/api/auth/firebase";
  }, []);

  const exchangeFirebaseToken = async (idToken: string, profile?: { name?: string; phone?: string }) => {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken, profile }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      if (res.status === 403 && data?.code === "EMAIL_NOT_VERIFIED") {
        const err = new Error(
          typeof data?.message === "string" && data.message ? data.message : "يجب تفعيل الحساب أولاً"
        ) as any;
        err.code = "EMAIL_NOT_VERIFIED";
        throw err;
      }
      if (res.status === 409 && data?.code === "PHONE_ALREADY_IN_USE") {
        throw new Error(typeof data?.message === "string" && data.message ? data.message : "هذا رقم الجوال مستخدم بالفعل");
      }
      if (res.status === 409 && data?.code === "EMAIL_ALREADY_IN_USE") {
        throw new Error(typeof data?.message === "string" && data.message ? data.message : "هذا البريد الإلكتروني مستخدم بالفعل");
      }
      const message = data?.message || "فشل تسجيل الدخول";
      throw new Error(message);
    }

    const token = data?.data?.token;
    if (typeof token !== "string" || !token) {
      throw new Error("فشل تسجيل الدخول");
    }
    localStorage.setItem("auth_token", token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[Login] Submitting form with data:', { name: formData.name, email: formData.email });

    try {
      const auth = await getFirebaseAuth();
      const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      await result.user.reload();

      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        try {
          sessionStorage.setItem(
            "pending_verification_profile",
            JSON.stringify({
              name: formData.name,
            })
          );
        } catch {}

        setLocation(`/verify?next=${encodeURIComponent("/dashboard")}`);
        return;
      }

      const idToken = await result.user.getIdToken();
      await exchangeFirebaseToken(idToken, { name: formData.name });
      setLocation("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      const err = error as any;
      if (err?.code === "EMAIL_NOT_VERIFIED") {
        setLocation(`/verify?next=${encodeURIComponent("/dashboard")}`);
        return;
      }
      setServerError(error instanceof Error ? error.message : "فشل تسجيل الدخول");
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      const auth = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      await exchangeFirebaseToken(idToken, { name: formData.name });
      setLocation("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      const err = error as any;
      if (err?.code === "auth/unauthorized-domain") {
        const host = typeof window !== "undefined" ? window.location.hostname : "";
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        setServerError(
          `الدومين غير مُصرّح به في Firebase: ${host || origin}. أضف هذا الدومين إلى Authorized domains ثم أعد المحاولة.`
        );
      } else {
        setServerError(error instanceof Error ? error.message : "فشل تسجيل الدخول بواسطة Gmail");
      }
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
                <GmailIcon className="h-4 w-4" />
                {googleLoading ? "جاري تسجيل الدخول..." : "دخول بواسطة Gmail"}
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
