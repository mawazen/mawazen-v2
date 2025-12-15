import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Briefcase, Calendar, FileText } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useRoute } from "wouter";

const caseTypeLabels: Record<string, string> = {
  criminal: "جنائي",
  commercial: "تجاري",
  family: "أحوال شخصية",
  administrative: "إداري",
  labor: "عمالي",
  real_estate: "عقاري",
  other: "أخرى",
};

const stageLabels: Record<string, string> = {
  intake: "استلام",
  filing: "رفع الدعوى",
  discovery: "التحقيق",
  hearing: "الجلسات",
  judgment: "الحكم",
  appeal: "الاستئناف",
  execution: "التنفيذ",
  closed: "مغلقة",
};

const statusLabels: Record<string, string> = {
  active: "نشطة",
  pending: "معلقة",
  on_hold: "متوقفة",
  won: "مكسوبة",
  lost: "خاسرة",
  settled: "تسوية",
  closed: "مغلقة",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  on_hold: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  won: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
  settled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function CaseDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/cases/:id");

  const caseId = useMemo(() => {
    const raw = params?.id;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [params?.id]);

  const { data: caseItem, isLoading: caseLoading } = trpc.cases.getById.useQuery(
    { id: caseId ?? 0 },
    { enabled: Boolean(match) && caseId !== null }
  );

  const { data: documents, isLoading: documentsLoading } = trpc.cases.getDocuments.useQuery(
    { caseId: caseId ?? 0 },
    { enabled: Boolean(match) && caseId !== null }
  );

  const { data: client } = trpc.clients.getById.useQuery(
    { id: caseItem?.clientId ?? 0 },
    { enabled: Boolean(caseItem?.clientId) }
  );

  if (!match || caseId === null) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setLocation("/cases")}
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            الرجوع
          </Button>
          <Card className="card-gold">
            <CardContent className="p-6 text-muted-foreground">القضية غير موجودة</CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {caseLoading ? "..." : (caseItem?.title ?? "")}
            </h1>
            <p className="text-muted-foreground mt-1">تفاصيل القضية</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/cases")}
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            الرجوع
          </Button>
        </div>

        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-gold" />
              معلومات القضية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : caseItem ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={statusColors[String(caseItem.status)] ?? ""}
                  >
                    {statusLabels[String(caseItem.status)] ?? String(caseItem.status)}
                  </Badge>
                  <Badge variant="outline">
                    {caseTypeLabels[String(caseItem.type)] ?? String(caseItem.type)}
                  </Badge>
                  <Badge variant="outline">
                    {stageLabels[String(caseItem.stage)] ?? String(caseItem.stage)}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  رقم القضية: {caseItem.caseNumber}
                </div>

                {client?.name && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">العميل: </span>
                    <button
                      className="text-gold hover:underline"
                      onClick={() => setLocation(`/clients/${client.id}`)}
                    >
                      {client.name}
                    </button>
                  </div>
                )}

                {(caseItem.court || caseItem.nextHearingDate) && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {caseItem.court && <span>{caseItem.court}</span>}
                    {caseItem.nextHearingDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        الجلسة القادمة: {new Date(caseItem.nextHearingDate as any).toLocaleDateString("ar-SA")}
                      </span>
                    )}
                  </div>
                )}

                {caseItem.description && (
                  <div className="text-sm text-muted-foreground">{caseItem.description}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">القضية غير موجودة</div>
            )}
          </CardContent>
        </Card>

        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold" />
              مستندات القضية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documentsLoading ? (
              <>
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </>
            ) : (documents?.length ?? 0) > 0 ? (
              documents!.map((d) => (
                <div key={d.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(d.createdAt as any).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(d.fileUrl, "_blank")}
                    >
                      عرض
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                لا توجد مستندات لهذه القضية
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
