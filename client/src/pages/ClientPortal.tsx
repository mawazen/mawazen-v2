import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Briefcase,
  FileText,
  DollarSign,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ClientPortal() {
  const { user } = useAuth();
  const { data: cases, isLoading: casesLoading } = trpc.cases.list.useQuery();
  const { data: invoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery();

  const caseStatusColors: Record<string, string> = {
    active: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    on_hold: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    won: "bg-green-500/20 text-green-400 border-green-500/30",
    lost: "bg-red-500/20 text-red-400 border-red-500/30",
    settled: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const caseStatusLabels: Record<string, string> = {
    active: "نشطة",
    pending: "قيد الانتظار",
    on_hold: "موقوفة",
    won: "مكسوبة",
    lost: "خاسرة",
    settled: "تسوية",
    closed: "مغلقة",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-secondary/50 border-b border-border/50 py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            مرحباً {user?.name || "العميل"}
          </h1>
          <p className="text-muted-foreground">
            بوابة العميل - متابعة قضاياك والفواتير
          </p>
        </div>
      </div>

      <div className="container py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي القضايا</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {cases?.length ?? 0}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-gold opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">القضايا النشطة</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    {cases?.filter((c) => c.status === "active").length ?? 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الفواتير المستحقة</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {invoices?.filter((i) => i.status === "overdue" || i.status === "sent").length ?? 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الرسائل الجديدة</p>
                  <p className="text-2xl font-bold text-gold mt-1">0</p>
                </div>
                <MessageSquare className="h-8 w-8 text-gold opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cases Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-gold" />
            قضاياك
          </h2>

          {casesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : cases && cases.length > 0 ? (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <Card key={caseItem.id} className="card-gold hover:border-gold/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-2">
                          {caseItem.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>رقم القضية: {caseItem.caseNumber}</span>
                          <span>•</span>
                          <span>النوع: {caseItem.type}</span>
                          <span>•</span>
                          <span>المحكمة: {caseItem.court || "غير محددة"}</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={caseStatusColors[caseItem.status] || ""}
                      >
                        {caseStatusLabels[caseItem.status] || caseItem.status}
                      </Badge>
                    </div>

                    {caseItem.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {caseItem.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-sm text-muted-foreground">
                        {caseItem.nextHearingDate && (
                          <span>
                            الجلسة القادمة:{" "}
                            {new Date(caseItem.nextHearingDate).toLocaleDateString("ar-SA")}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info("عرض تفاصيل القضية قيد التطوير")}
                      >
                        عرض التفاصيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="card-gold">
              <CardContent className="p-12 text-center">
                <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">لا توجد قضايا حالياً</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Invoices Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-gold" />
            الفواتير
          </h2>

          {invoicesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="card-gold">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-bold text-foreground">
                            فاتورة #{invoice.invoiceNumber}
                          </h3>
                          <Badge
                            variant="outline"
                            className={
                              invoice.status === "paid"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : invoice.status === "sent"
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                  : invoice.status === "overdue"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }
                          >
                            {invoice.status === "paid"
                              ? "مدفوعة"
                              : invoice.status === "sent"
                                ? "قيد الانتظار"
                                : invoice.status === "overdue"
                                  ? "متأخرة"
                                  : invoice.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            التاريخ:{" "}
                            {new Date(invoice.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                          <span>•</span>
                          <span>المبلغ: {invoice.amount.toLocaleString()} ر.س</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {invoice.status === "paid" ? (
                          <CheckCircle2 className="h-6 w-6 text-green-400" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-yellow-400" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info("تحميل الفاتورة قيد التطوير")}
                        >
                          <Download className="h-4 w-4 ml-2" />
                          تحميل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="card-gold">
              <CardContent className="p-12 text-center">
                <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">لا توجد فواتير</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Documents Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-gold" />
            المستندات
          </h2>

          <Card className="card-gold">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-6">
                المستندات المتعلقة بقضاياك ستظهر هنا
              </p>
              <Button
                variant="outline"
                className="border-gold/30 hover:border-gold/50"
                onClick={() => toast.info("طلب مستند جديد قيد التطوير")}
              >
                طلب مستند
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
