import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Briefcase,
  Calendar,
  Download,
  FileText,
  History,
  Receipt,
  Shield,
  Wallet,
  Printer,
} from "lucide-react";
import { useMemo } from "react";
import { useRoute } from "wouter";

const formatDate = (value: any) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("ar-SA");
  } catch {
    return "-";
  }
};

const invoiceStatusLabel = (status: any) => {
  const s = String(status ?? "");
  if (s === "paid") return "مدفوعة";
  if (s === "sent") return "قيد الانتظار";
  if (s === "overdue") return "متأخرة";
  if (s === "draft") return "مسودة";
  return s || "-";
};

const invoiceStatusColor = (status: any) => {
  const s = String(status ?? "");
  if (s === "paid") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (s === "sent") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (s === "overdue") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
};

export default function PublicClientPortal() {
  const [match, params] = useRoute("/portal/:token");

  const token = useMemo(() => {
    const raw = params?.token;
    const t = typeof raw === "string" ? raw.trim() : "";
    return t.length > 0 ? t : null;
  }, [params?.token]);

  const { data, isLoading, error } = trpc.portal.get.useQuery(
    { token: token ?? "" },
    { enabled: Boolean(match) && Boolean(token) }
  );

  if (!match) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-secondary/50 border-b border-border/50 py-8">
        <div className="container">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-foreground mb-2 truncate">
                {isLoading ? "..." : (data?.client?.name ?? "بوابة العميل")}
              </h1>
              <p className="text-muted-foreground">
                بوابة آمنة لمتابعة القضايا والجلسات والفواتير والمستندات
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-gold/30 hover:border-gold/50"
                onClick={() => window.print()}
                data-print-hide
              >
                <Printer className="h-4 w-4 rtl:mr-2 ml-2" />
                طباعة
              </Button>
              <Shield className="h-6 w-6 text-gold opacity-70" />
            </div>
          </div>
        </div>
      </div>

      <div className="container py-10 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <Card className="card-gold">
            <CardContent className="p-8 text-center text-muted-foreground">
              رابط البوابة غير صالح أو تم تعطيله.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="card-gold">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">القضايا</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {data?.cases?.length ?? 0}
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
                      <p className="text-sm text-muted-foreground">الجلسات</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {data?.hearings?.length ?? 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-gold opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-gold">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">الفواتير</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {data?.invoices?.length ?? 0}
                      </p>
                    </div>
                    <Receipt className="h-8 w-8 text-gold opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-gold">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">المدفوعات</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {data?.payments?.length ?? 0}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-gold opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-gold">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">المستندات</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {data?.documents?.length ?? 0}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-gold opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-gold">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-gold" />
                    الجدول الزمني
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.timeline?.length ?? 0) === 0 ? (
                    <div className="p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                      لا توجد أحداث حتى الآن
                    </div>
                  ) : (
                    (data?.timeline ?? []).slice(0, 25).map((e: any) => (
                      <div
                        key={`${e.kind}-${e.id}`}
                        className="p-3 rounded-lg border border-border/50 bg-secondary/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {String(e.title ?? "")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(e.at)}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20">
                            {String(e.kind)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="card-gold">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gold" />
                    المستندات المشتركة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.documents?.length ?? 0) === 0 ? (
                    <div className="p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                      لا توجد مستندات مشتركة
                    </div>
                  ) : (
                    (data?.documents ?? []).map((d: any) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-lg border border-border/50 bg-secondary/20"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{d.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(d.createdAt)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (d.fileUrl) window.open(d.fileUrl, "_blank");
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-gold">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gold" />
                    القضايا
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.cases?.length ?? 0) === 0 ? (
                    <div className="p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                      لا توجد قضايا
                    </div>
                  ) : (
                    (data?.cases ?? []).map((c: any) => (
                      <div key={c.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{c.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              رقم القضية: {c.caseNumber}
                            </p>
                          </div>
                          <Badge variant="outline">{String(c.status ?? "")}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="card-gold">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gold" />
                    الجلسات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.hearings?.length ?? 0) === 0 ? (
                    <div className="p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                      لا توجد جلسات
                    </div>
                  ) : (
                    (data?.hearings ?? []).map((h: any) => (
                      <div key={h.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{h.title ?? "جلسة"}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(h.hearingDate)}
                            </p>
                          </div>
                          <Badge variant="outline">{String(h.status ?? "")}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-gold">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-gold" />
                    الفواتير
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.invoices?.length ?? 0) === 0 ? (
                    <div className="p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                      لا توجد فواتير
                    </div>
                  ) : (
                    (data?.invoices ?? []).map((i: any) => (
                      <div key={i.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              فاتورة #{String(i.invoiceNumber ?? i.id)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(i.createdAt)}
                            </p>
                          </div>
                          <Badge variant="outline" className={invoiceStatusColor(i.status)}>
                            {invoiceStatusLabel(i.status)}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          الإجمالي: {Number(i.totalAmount ?? i.amount ?? 0).toLocaleString()} {String(i.currency ?? "")}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="card-gold">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-gold" />
                    المدفوعات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.payments?.length ?? 0) === 0 ? (
                    <div className="p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                      لا توجد مدفوعات
                    </div>
                  ) : (
                    (data?.payments ?? []).map((p: any) => (
                      <div key={p.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">دفعة</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(p.paidAt)}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {Number(p.amount ?? 0).toLocaleString()} {String(p.currency ?? "")}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          فاتورة: #{String(p.invoiceId ?? "-")} • الطريقة: {String(p.method ?? "-")}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
