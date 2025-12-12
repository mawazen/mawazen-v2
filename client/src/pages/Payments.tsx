import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CreditCard,
  Smartphone,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const subscriptionPlans = [
  {
    id: "individual" as const,
    name: "اشتراك فردي",
    price: 149,
    period: "شهرياً",
    description: "مثالي للمحامي الفرد الذي يريد مساعدًا قانونيًا ذكيًا في كل قضية.",
    features: [
      "مساعد قانوني ذكي متخصص في الأنظمة السعودية",
      "تحليل غير محدود للقضايا والاستشارات",
      "صياغة مذكرات ولوائح بطريقة احترافية",
    ],
  },
  {
    id: "office" as const,
    name: "اشتراك مكتب محاماة",
    price: 399,
    period: "شهرياً",
    description: "أنسب لاستخدام مكتب محاماة صغير أو متوسط بعدة ملفات نشطة.",
    features: [
      "دعم عدة مستخدمين داخل نفس المكتب (حسب سياسة الترخيص)",
      "تحليل قضايا متعددة في آن واحد",
      "تقارير وتوصيات استراتيجية للمكتب",
    ],
  },
  {
    id: "team" as const,
    name: "اشتراك فريق/منشأة قانونية",
    price: 899,
    period: "شهرياً",
    description: "مخصص للمكاتب الكبيرة أو الفرق القانونية في الشركات والجهات الحكومية.",
    features: [
      "أفضلية في الموارد والوصول السريع للمساعد",
      "إمكانية تخصيص أوسع للاستخدام داخل الفريق",
      "ملائم لحجم عمل كبير وعدد مستخدمين أعلى",
    ],
  },
] as const;

type SubscriptionPlanId = (typeof subscriptionPlans)[number]["id"];

export default function Payments() {
  const [selectedGateway, setSelectedGateway] = useState<"stripe" | "stc" | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId | null>(null);

  const activateSubscription = trpc.subscriptions.activate.useMutation({
    onSuccess: () => {
      toast.success(
        "تم تفعيل اشتراكك الشهري بنجاح. يمكنك الآن استخدام المساعد القانوني الذكي.",
      );
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تفعيل الاشتراك. يرجى المحاولة مرة أخرى.");
    },
  });

  const paymentGateways = [
    {
      id: "stripe",
      name: "Stripe",
      icon: CreditCard,
      description: "بطاقات ائتمان وتحويلات بنكية",
      features: [
        "بطاقات Visa و Mastercard",
        "تحويلات بنكية مباشرة",
        "محفظة رقمية",
        "دعم عملات متعددة",
      ],
      status: "متصل",
    },
    {
      id: "stc",
      name: "STC Pay",
      icon: Smartphone,
      description: "محفظة STC الرقمية",
      features: [
        "دفع فوري من STC Pay",
        "رسوم منخفضة",
        "تحويل أموال سريع",
        "دعم جميع العملاء السعوديين",
      ],
      status: "متصل",
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      invoice: "INV-2024-001",
      amount: 5000,
      method: "Stripe",
      date: "2024-12-10",
      status: "completed",
    },
    {
      id: 2,
      invoice: "INV-2024-002",
      amount: 3500,
      method: "STC Pay",
      date: "2024-12-09",
      status: "completed",
    },
    {
      id: 3,
      invoice: "INV-2024-003",
      amount: 7200,
      method: "Stripe",
      date: "2024-12-08",
      status: "completed",
    },
    {
      id: 4,
      invoice: "INV-2024-004",
      amount: 2800,
      method: "STC Pay",
      date: "2024-12-07",
      status: "pending",
    },
  ];

  const handlePayment = () => {
    if (!selectedGateway || !paymentAmount) {
      toast.error("يرجى اختيار طريقة الدفع وإدخال المبلغ");
      return;
    }

    // هنا يتم تفعيل الاشتراك الشهري داخل النظام بعد إتمام الدفع عبر البوابة
    activateSubscription.mutate();
  };

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
            إدارة طرق الدفع والتحويلات المالية
          </p>
        </div>

        {/* Subscription Plans */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">خطط الاشتراك الشهرية</h2>
          <p className="text-sm text-muted-foreground mb-4">
            اختر الخطة الأنسب لطبيعة عملك القانوني، وجميع الأسعار بالريال السعودي شهرياً.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isPopular = plan.id === "office";
              return (
                <Card
                  key={plan.id}
                  className={`card-gold relative cursor-pointer transition-all border-border/60 ${
                    isSelected ? "border-gold ring-2 ring-gold/50" : "hover:border-gold/50"
                  }`}
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    setPaymentAmount(String(plan.price));
                  }}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-4 bg-gold text-black border-gold/80 text-[11px] px-2 py-0.5">
                      الأكثر اختياراً
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentGateways.map((gateway) => {
              const Icon = gateway.icon;
              return (
                <Card
                  key={gateway.id}
                  className={`card-gold cursor-pointer transition-all ${
                    selectedGateway === gateway.id
                      ? "border-gold ring-2 ring-gold/50"
                      : "hover:border-gold/50"
                  }`}
                  onClick={() => setSelectedGateway(gateway.id as "stripe" | "stc")}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gold/10 rounded-lg">
                          <Icon className="h-6 w-6 text-gold" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{gateway.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {gateway.description}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {gateway.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {gateway.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Form */}
        {selectedGateway && (
          <Card className="card-gold">
            <CardHeader>
              <CardTitle>إنشاء دفعة جديدة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-foreground mb-2 block">المبلغ (ر.س)</Label>
                  <Input
                    type="number"
                    placeholder="أدخل المبلغ"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-foreground mb-2 block">رقم الفاتورة</Label>
                  <Input
                    type="text"
                    placeholder="مثال: INV-2024-001"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">المبلغ الإجمالي:</span>
                  <span className="text-2xl font-bold text-gold">
                    {paymentAmount ? `${paymentAmount} ر.س` : "0 ر.س"}
                  </span>
                </div>
                {selectedPlan && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>الخطة المختارة:</span>
                    <span className="font-medium">
                      {subscriptionPlans.find((p) => p.id === selectedPlan)?.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>طريقة الدفع:</span>
                  <span className="font-medium">
                    {selectedGateway === "stripe" ? "Stripe" : "STC Pay"}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  className="flex-1 bg-gold hover:bg-gold-light text-black font-semibold"
                  onClick={handlePayment}
                  disabled={activateSubscription.isPending}
                >
                  <ArrowRight className="h-4 w-4 ml-2" />
                  متابعة الدفع
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gold/30 hover:border-gold/50"
                  onClick={() => setSelectedGateway(null)}
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">المعاملات الأخيرة</h2>
          <Card className="card-gold">
            <CardContent className="p-0">
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
                        طريقة الدفع
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
                    {recentTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {transaction.invoice}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {transaction.amount.toLocaleString()} ر.س
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {transaction.method}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString("ar-SA")}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            variant="outline"
                            className={
                              transaction.status === "completed"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            }
                          >
                            {transaction.status === "completed" ? "مكتملة" : "قيد الانتظار"}
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
            </CardContent>
          </Card>
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-gold">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">إجمالي المدفوعات</p>
              <p className="text-3xl font-bold text-gold">18,500 ر.س</p>
              <p className="text-xs text-muted-foreground mt-2">هذا الشهر</p>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">المدفوعات المعلقة</p>
              <p className="text-3xl font-bold text-yellow-400">2,800 ر.س</p>
              <p className="text-xs text-muted-foreground mt-2">1 معاملة</p>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">معدل النجاح</p>
              <p className="text-3xl font-bold text-green-400">98.5%</p>
              <p className="text-xs text-muted-foreground mt-2">آخر 30 يوم</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
