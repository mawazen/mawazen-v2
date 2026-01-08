import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Mail, Phone, RefreshCw } from "lucide-react";
import {
  RecaptchaVerifier,
  linkWithPhoneNumber,
  sendEmailVerification,
} from "firebase/auth";
import { getFirebaseAuth } from "@/_core/firebase";

type PendingProfile = {
  name?: string;
  phone?: string;
  organizationName?: string;
};

export default function Verify() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"email" | "sms">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsStep, setSmsStep] = useState<"idle" | "code_sent">("idle");
  const [phoneConfirmation, setPhoneConfirmation] = useState<any>(null);

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const urlParams = new URLSearchParams(window.location.search);
    const next = urlParams.get("next");
    return next && next.startsWith("/") ? next : "/dashboard";
  }, []);

  const apiUrl = useMemo(() => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
    return apiBase ? `${apiBase}/api/auth/firebase` : "/api/auth/firebase";
  }, []);

  const pendingProfile = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("pending_verification_profile");
      if (!raw) return null;
      return JSON.parse(raw) as PendingProfile;
    } catch {
      return null;
    }
  }, []);

  const normalizePhone = (raw: string) => {
    const v = (raw ?? "").trim();
    if (!v) return "";
    if (v.startsWith("+")) return v;
    return v;
  };

  const firebaseErrorMessage = (e: unknown) => {
    const err = e as any;
    const code = typeof err?.code === "string" ? err.code : "";

    if (code === "auth/billing-not-enabled") {
      return "لا يمكن تفعيل الحساب عبر SMS لأن Billing غير مُفعّل في Firebase. فعّل خطة Blaze من Firebase Console أو اختر التفعيل عبر البريد الإلكتروني.";
    }
    if (code === "auth/credential-already-in-use" || code === "auth/phone-number-already-exists") {
      return "هذا رقم الجوال مستخدم بالفعل بحساب آخر. استخدم رقمًا آخر أو اختر التفعيل عبر البريد الإلكتروني.";
    }
    if (code === "auth/provider-already-linked") {
      return "تم تفعيل رقم الجوال بالفعل لهذا الحساب.";
    }
    if (code === "auth/invalid-verification-code") {
      return "رمز التحقق غير صحيح.";
    }
    if (code === "auth/code-expired") {
      return "انتهت صلاحية الرمز. اطلب رمزًا جديدًا.";
    }
    if (code === "auth/too-many-requests") {
      return "تم إرسال محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
    }

    return e instanceof Error ? e.message : "حدث خطأ غير متوقع";
  };

  const finalizeSession = async () => {
    const auth = await getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) {
      setLocation("/login");
      return;
    }

    const idToken = await user.getIdToken(true);

    const profileToSend: PendingProfile | undefined = (() => {
      if (!pendingProfile) {
        return user.phoneNumber ? { phone: user.phoneNumber } : undefined;
      }

      const next: PendingProfile = { ...pendingProfile };
      if (user.phoneNumber) {
        next.phone = user.phoneNumber;
      } else {
        delete next.phone;
      }
      return next;
    })();

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
        profile: profileToSend,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      if (res.status === 409 && (data?.code === "PHONE_ALREADY_IN_USE" || data?.code === "EMAIL_ALREADY_IN_USE")) {
        throw new Error(typeof data?.message === "string" && data.message ? data.message : "هذه البيانات مستخدمة بالفعل");
      }
      if (res.status === 403 && data?.code === "EMAIL_NOT_VERIFIED") {
        throw new Error(typeof data?.message === "string" && data.message ? data.message : "لم يتم تفعيل الحساب بعد");
      }

      const message = typeof data?.message === "string" && data.message ? data.message : "لم يتم تفعيل الحساب بعد";
      throw new Error(message);
    }

    const token = data?.data?.token;
    if (typeof token !== "string" || !token) {
      throw new Error("فشل إنشاء الجلسة");
    }

    localStorage.setItem("auth_token", token);
    try {
      sessionStorage.removeItem("pending_verification_profile");
    } catch {}

    setLocation(nextPath);
  };

  const getOrCreateRecaptcha = async () => {
    const auth = await getFirebaseAuth();
    const w = window as any;
    if (!w.__mawazenRecaptchaVerify) {
      w.__mawazenRecaptchaVerify = new RecaptchaVerifier(auth, "recaptcha-container-verify", {
        size: "invisible",
      });
    }
    return w.__mawazenRecaptchaVerify as RecaptchaVerifier;
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError("");
    setStatus("");
    try {
      const auth = await getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        setLocation("/login");
        return;
      }
      await sendEmailVerification(user);
      setStatus("تم إرسال رسالة التفعيل إلى بريدك.");
    } catch (e) {
      setError(firebaseErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleIHaveVerified = async () => {
    setIsLoading(true);
    setError("");
    setStatus("");
    try {
      const auth = await getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        setLocation("/login");
        return;
      }
      await user.reload();
      if (!user.emailVerified && !user.phoneNumber) {
        throw new Error("لم يتم تفعيل الحساب بعد. فعّل البريد أو أكمل تفعيل الجوال.");
      }
      await finalizeSession();
    } catch (e) {
      setError(firebaseErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSms = async () => {
    setIsLoading(true);
    setError("");
    setStatus("");
    try {
      const auth = await getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        setLocation("/login");
        return;
      }

      const phone = normalizePhone(phoneNumber);
      if (!phone || !phone.startsWith("+")) {
        throw new Error("اكتب رقم الجوال بصيغة دولية تبدأ بـ + (مثال: +9665xxxxxxx)");
      }

      const verifier = await getOrCreateRecaptcha();
      const confirmation = await linkWithPhoneNumber(user, phone, verifier);
      setPhoneConfirmation(confirmation);
      setSmsStep("code_sent");
      setStatus("تم إرسال رمز التحقق إلى جوالك.");
    } catch (e) {
      const msg = firebaseErrorMessage(e);
      setError(msg);
      if ((e as any)?.code === "auth/billing-not-enabled") {
        setMode("email");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySms = async () => {
    setIsLoading(true);
    setError("");
    setStatus("");
    try {
      if (!phoneConfirmation) throw new Error("اطلب رمز التحقق أولاً");
      await phoneConfirmation.confirm(smsCode);
      await finalizeSession();
    } catch (e) {
      setError(firebaseErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const auth = await getFirebaseAuth();
        const user = auth.currentUser;
        if (!user) {
          setLocation("/login");
          return;
        }

        await user.reload();
        if (user.emailVerified || user.phoneNumber) {
          await finalizeSession();
        }
      } catch {
      }
    })();
  }, []);

  return (
    <div className="container py-12 lg:py-16">
      <div className="mx-auto max-w-xl card-gold rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">تفعيل الحساب</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              اختر طريقة التفعيل لإكمال تسجيل الدخول
            </p>
          </div>
          <CheckCircle2 className="h-10 w-10 text-gold" />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("email")}
            className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
              mode === "email"
                ? "bg-gold text-black border-gold"
                : "bg-transparent text-foreground border-border/60 hover:border-gold/50"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              البريد الإلكتروني
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("sms")}
            className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
              mode === "sms"
                ? "bg-gold text-black border-gold"
                : "bg-transparent text-foreground border-border/60 hover:border-gold/50"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              رسالة SMS
            </span>
          </button>
        </div>

        <div className="mt-4">
          <div id="recaptcha-container-verify" />

          {mode === "email" ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isLoading}
                className="glass w-full rounded-2xl px-4 py-3 text-sm font-semibold text-foreground hover:border-gold/40"
              >
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  إعادة إرسال رسالة التفعيل
                </span>
              </button>

              <button
                type="button"
                onClick={handleIHaveVerified}
                disabled={isLoading}
                className="btn-gold w-full rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                تم التفعيل — متابعة
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {smsStep === "idle" ? (
                <>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="رقم الجوال بصيغة دولية مثال: +9665xxxxxxx"
                    className="glass w-full rounded-2xl px-4 py-3 text-right"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={handleSendSms}
                    disabled={isLoading}
                    className="glass w-full rounded-2xl px-4 py-3 text-sm font-semibold text-foreground hover:border-gold/40"
                  >
                    إرسال رمز التحقق
                  </button>
                </>
              ) : (
                <>
                  <input
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="رمز التحقق"
                    className="glass w-full rounded-2xl px-4 py-3 text-right"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={handleVerifySms}
                    disabled={isLoading}
                    className="btn-gold w-full rounded-2xl px-4 py-3 text-sm font-semibold"
                  >
                    تأكيد الرمز — متابعة
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {status ? (
          <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-foreground">
            {status}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
