import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Download,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

declare global {
  interface Window {
    Moyasar?: any;
  }
}

const getPlanFromUrl = (): SubscriptionPlanId | null => {
  if (typeof window === "undefined") return null;
  const urlParams = new URLSearchParams(window.location.search);
  const plan = urlParams.get("plan");
  if (plan === "individual" || plan === "law_firm" || plan === "enterprise") {
    return plan;
  }
  return null;
};

const invoiceStatusLabel: Record<string, string> = {
  draft: "مسودة",
  sent: "مرسلة",
  paid: "مدفوعة",
  partial: "مدفوعة جزئياً",
  overdue: "متأخرة",
  cancelled: "ملغاة",
};

const invoiceStatusClass: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const subscriptionPlans = [
  {
    id: "individual" as const,
    name: "فردي",
    price: 1549,
    period: "سنوياً",
    description: "مناسب للمستخدم الفردي لإدارة القضايا والاستفادة من المساعد القانوني.",
    features: [
      "عدد المستخدمين: 1",
      "مساعد قانوني ذكي متخصص في الأنظمة السعودية",
      "تحليل القضايا والاستشارات وصياغة المستندات حسب الاستخدام العادل",
      "تفعيل الاشتراك في بيئة الإنتاج يتم عبر القنوات المعتمدة",
    ],
  },
  {
    id: "law_firm" as const,
    name: "مكتب محاماة",
    price: 4599,
    period: "سنوياً",
    description: "مناسب للمكاتب الصغيرة والمتوسطة مع فريق عمل.",
    features: [
      "عدد المستخدمين: 5",
      "إدارة الفريق والصلاحيات داخل النظام",
      "مساعد قانوني ذكي متخصص في الأنظمة السعودية",
      "تحليل القضايا والاستشارات وصياغة المستندات حسب الاستخدام العادل",
      "تفعيل الاشتراك في بيئة الإنتاج يتم عبر القنوات المعتمدة",
    ],
  },
  {
    id: "enterprise" as const,
    name: "منشأة",
    price: 8999,
    period: "سنوياً",
    description: "مناسب للمنشآت القانونية والإدارات ذات الحجم الأكبر.",
    features: [
      "عدد المستخدمين: 15",
      "إدارة الفريق والصلاحيات داخل النظام",
      "مساعد قانوني ذكي متخصص في الأنظمة السعودية",
      "تحليل القضايا والاستشارات وصياغة المستندات حسب الاستخدام العادل",
      "تفعيل الاشتراك في بيئة الإنتاج يتم عبر القنوات المعتمدة",
    ],
  },
] as const;

type SubscriptionPlanId = (typeof subscriptionPlans)[number]["id"];

export default function Payments() {
  const [, setLocation] = useLocation();
  const [selectedGateway, setSelectedGateway] = useState<"moyasar" | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "applepay" | "tabby" | "tamara" | "cod"
  >("card");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId | null>(() => {
    return getPlanFromUrl();
  });

  const backendOrigin = import.meta.env.VITE_BACKEND_ORIGIN ?? "";
  const moyasarPublishableKey = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY ?? "";
  const moyasarContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedPlanDetails = useMemo(() => {
    if (!selectedPlan) return null;
    return subscriptionPlans.find((p) => p.id === selectedPlan) ?? null;
  }, [selectedPlan]);

  useEffect(() => {
    if (!selectedPlan) return;
    const selected = subscriptionPlans.find((p) => p.id === selectedPlan);
    if (!selected) return;
    setPaymentAmount(String(selected.price));
  }, [selectedPlan]);

  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: invoiceStats } = trpc.invoices.stats.useQuery();

  const activatePaid = trpc.subscriptions.activatePaid.useMutation({
    onSuccess: () => {
      toast.success("تم تفعيل اشتراكك السنوي بنجاح.");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "تعذر تأكيد الدفع. يرجى التواصل مع الدعم.");
    },
  });

  // Handle Moyasar redirect callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    const paymentId = qs.get("id");
    const status = qs.get("status");
    const planFromUrl = getPlanFromUrl();
    const planToActivate = planFromUrl ?? selectedPlan;
    if (!paymentId || !status) return;
    if (!planToActivate) return;

    if (status !== "paid" && status !== "captured") {
      toast.error("لم يتم إتمام الدفع.");
      return;
    }

    activatePaid.mutate({ plan: planToActivate, paymentId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan]);

  // Init Moyasar payment form when plan is selected
  useEffect(() => {
    if (!selectedPlanDetails) return;
    if (!moyasarPublishableKey) return;
    if (!moyasarContainerRef.current) return;
    if (typeof window === "undefined") return;
    if (!window.Moyasar?.init) return;
    if (!selectedGateway) return;

    const method = selectedPaymentMethod === "applepay" ? "applepay" : "creditcard";
    if (selectedPaymentMethod !== "card" && selectedPaymentMethod !== "applepay") return;

    moyasarContainerRef.current.innerHTML = "";

    const amountHalalas = selectedPlanDetails.price * 100;
    const callbackUrl = `${window.location.origin}/payments?plan=${encodeURIComponent(
      selectedPlanDetails.id
    )}`;

    window.Moyasar.init({
      element: moyasarContainerRef.current,
      amount: amountHalalas,
      currency: "SAR",
      description: `اشتراك سنوي - ${selectedPlanDetails.name}`,
      metadata: {
        plan: selectedPlanDetails.id,
      },
      publishable_api_key: moyasarPublishableKey,
      callback_url: callbackUrl,
      supported_networks: ["visa", "mastercard", "mada"],
      methods: [method],
      language: "ar",
      apple_pay: {
        country: "SA",
        label: "موازين",
        validate_merchant_url: "https://api.moyasar.com/v1/applepay/initiate",
      },
      on_failure: function () {
        toast.error("تعذر بدء الدفع. حاول مرة أخرى.");
      },
    });
  }, [moyasarPublishableKey, selectedPlanDetails, selectedGateway, selectedPaymentMethod]);

  const paymentGateways = [
    {
      id: "moyasar",
      name: "Moyasar",
      icon: CreditCard,
      description: "Visa / mada / Apple Pay",
      features: [
        "دعم Visa و Mastercard و mada",
        "Apple Pay على أجهزة Apple المدعومة",
        "الأسعار بالريال السعودي",
        "3D Secure عند الحاجة",
      ],
      status: "متاح",
    },
  ];

  const recentInvoices = (invoices ?? []).slice(0, 10);

  const paidAmount = invoiceStats?.paidAmount ?? 0;
  const totalAmount = invoiceStats?.totalAmount ?? 0;
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const successRate = invoiceStats?.total
    ? ((invoiceStats.paid / invoiceStats.total) * 100).toFixed(1)
    : "0.0";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-gold" />
            إدارة المدفوعات
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة الاشتراك والفواتير، وتهيئة بوابات الدفع
          </p>
        </div>

        {/* Subscription Plans */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">خطط الاشتراك السنوية</h2>
          <p className="text-sm text-muted-foreground mb-4">
            اختر خطة الاشتراك، وجميع الأسعار بالريال السعودي سنوياً.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isPopular = isSelected;
              return (
                <Card
                  key={plan.id}
                  className={`card-gold relative cursor-pointer transition-all border-border/60 ${
                    isSelected ? "border-gold ring-2 ring-gold/50" : "hover:border-gold/50"
                  }`}
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    setPaymentAmount(String(plan.price));
                    setSelectedGateway("moyasar");
                  }}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-4 bg-gold text-black border-gold/80 text-[11px] px-2 py-0.5">
                      الخطة الحالية
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-baseline justify-between gap-2">
                      <span>{plan.name}</span>
                      <span className="text-gold text-2xl font-bold flex items-baseline gap-1">
                        {plan.price.toLocaleString("ar-SA")}
                        <span className="text-xs text-muted-foreground font-normal">ر.س {plan.period}</span>
                      </span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Gateways */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">طرق الدفع المتاحة</h2>
          <p className="text-sm text-muted-foreground mb-4">
            أكمل الدفع لتفعيل اشتراكك السنوي بشكل تلقائي.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              className={`justify-center h-14 ${
                selectedPaymentMethod === "card"
                  ? "border-gold ring-2 ring-gold/40"
                  : "border-border/60 hover:border-gold/50"
              }`}
              onClick={() => {
                setSelectedGateway("moyasar");
                setSelectedPaymentMethod("card");
              }}
            >
              VISA / Mastercard
            </Button>

            <Button
              type="button"
              variant="outline"
              className={`justify-center h-14 ${
                selectedPaymentMethod === "card"
                  ? "border-gold/30"
                  : "border-border/60 hover:border-gold/50"
              }`}
              onClick={() => {
                setSelectedGateway("moyasar");
                setSelectedPaymentMethod("card");
              }}
            >
              mada
            </Button>

            <Button
              type="button"
              variant="outline"
              className={`justify-center h-14 ${
                selectedPaymentMethod === "applepay"
                  ? "border-gold ring-2 ring-gold/40"
                  : "border-border/60 hover:border-gold/50"
              }`}
              onClick={() => {
                setSelectedGateway("moyasar");
                setSelectedPaymentMethod("applepay");
              }}
            >
              Apple Pay
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled
              className="justify-center h-14 opacity-60"
              onClick={() => {
                setSelectedPaymentMethod("tabby");
                toast.info("Tabby يتطلب تكامل ومفاتيح منفصلة (غير مفعّل حالياً)");
              }}
            >
              tabby
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled
              className="justify-center h-14 opacity-60"
              onClick={() => {
                setSelectedPaymentMethod("tamara");
                toast.info("Tamara يتطلب تكامل ومفاتيح منفصلة (غير مفعّل حالياً)");
              }}
            >
              Tamara
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled
              className="justify-center h-14 opacity-60"
              onClick={() => {
                setSelectedPaymentMethod("cod");
                toast.info("الدفع عند الاستلام غير متاح للاشتراكات الرقمية");
              }}
            >
              الدفع عند الاستلام
            </Button>
          </div>
        </div>

        {/* Moyasar Form */}
        {selectedPlan && selectedGateway === "moyasar" && (
          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>إتمام الدفع</span>
                <span className="text-sm font-semibold text-gold">
                  {paymentAmount ? `${Number(paymentAmount).toLocaleString("ar-SA")} ر.س سنويًا` : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!moyasarPublishableKey ? (
                <div className="text-sm text-muted-foreground">
                  لم يتم إعداد مفاتيح Moyasar بعد. أضف المتغير <span className="font-mono">VITE_MOYASAR_PUBLISHABLE_KEY</span>.
                </div>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground mb-2 block">الخطة</Label>
                  <Input
                    value={selectedPlanDetails?.name ?? ""}
                    readOnly
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">المبلغ (ر.س)</Label>
                  <Input
                    value={paymentAmount}
                    readOnly
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                <div ref={moyasarContainerRef} className="mysr-form" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">المعاملات الأخيرة</h2>
          <Card className="card-gold">
            <CardContent className="p-0">
              {recentInvoices.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">لا توجد معاملات</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                          رقم الفاتورة
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                          المبلغ
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                          التاريخ
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                          الحالة
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                          الإجراء
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-foreground font-medium">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {((inv.totalAmount ?? 0) / 100).toLocaleString("ar-SA")} ر.س
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(inv.createdAt as any).toLocaleDateString("ar-SA")}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge
                              variant="outline"
                              className={invoiceStatusClass[String(inv.status)] ?? invoiceStatusClass.draft}
                            >
                              {invoiceStatusLabel[String(inv.status)] ?? String(inv.status)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toast.info("تحميل الإيصال قيد التطوير")}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-gold">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">إجمالي المدفوعات</p>
              <p className="text-3xl font-bold text-gold">
                {(paidAmount / 100).toLocaleString("ar-SA")} ر.س
              </p>
              <p className="text-xs text-muted-foreground mt-2">-</p>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">المدفوعات المعلقة</p>
              <p className="text-3xl font-bold text-yellow-400">
                {(pendingAmount / 100).toLocaleString("ar-SA")} ر.س
              </p>
              <p className="text-xs text-muted-foreground mt-2">-</p>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">معدل النجاح</p>
              <p className="text-3xl font-bold text-green-400">{successRate}%</p>
              <p className="text-xs text-muted-foreground mt-2">-</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
