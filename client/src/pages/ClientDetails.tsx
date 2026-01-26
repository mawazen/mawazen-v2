import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Briefcase, FileText, ArrowRight, Calendar, Download, Copy, Link2, ShieldOff } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

const caseStatusLabels: Record<string, string> = {
  active: "نشطة",
  pending: "معلقة",
  on_hold: "متوقفة",
  won: "مكسوبة",
  lost: "خاسرة",
  settled: "تسوية",
  closed: "مغلقة",
};

const caseStatusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  on_hold: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  won: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
  settled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const documentTypeLabels: Record<string, string> = {
  contract: "عقد",
  memo: "مذكرة",
  pleading: "لائحة",
  evidence: "دليل",
  correspondence: "مراسلة",
  court_order: "حكم قضائي",
  power_of_attorney: "وكالة",
  other: "أخرى",
};

const documentTypeColors: Record<string, string> = {
  contract: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  memo: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pleading: "bg-green-500/20 text-green-400 border-green-500/30",
  evidence: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  correspondence: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  court_order: "bg-red-500/20 text-red-400 border-red-500/30",
  power_of_attorney: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function ClientDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/clients/:id");

  const utils = trpc.useContext();

  const clientId = useMemo(() => {
    const raw = params?.id;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [params?.id]);

  const { data: client, isLoading: clientLoading } = trpc.clients.getById.useQuery(
    { id: clientId ?? 0 },
    { enabled: Boolean(match) && clientId !== null }
  );

  const { data: cases, isLoading: casesLoading } = trpc.clients.getCases.useQuery(
    { clientId: clientId ?? 0 },
    { enabled: Boolean(match) && clientId !== null }
  );

  const { data: documents, isLoading: documentsLoading } = trpc.clients.getDocuments.useQuery(
    { clientId: clientId ?? 0 },
    { enabled: Boolean(match) && clientId !== null }
  );

  const portalGenerate = trpc.clients.portalGenerate.useMutation({
    onSuccess: async (res) => {
      await utils.clients.getById.invalidate({ id: clientId ?? 0 });
      const link = `${window.location.origin}/portal/${res.token}`;
      await navigator.clipboard.writeText(link);
      toast.success("تم إنشاء رابط البوابة ونسخه");
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر إنشاء رابط البوابة"),
  });

  const portalDisable = trpc.clients.portalDisable.useMutation({
    onSuccess: async () => {
      await utils.clients.getById.invalidate({ id: clientId ?? 0 });
      toast.success("تم تعطيل بوابة العميل");
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر تعطيل بوابة العميل"),
  });

  const portalToken = (client as any)?.portalToken as string | null | undefined;
  const portalEnabled = Boolean((client as any)?.portalEnabled);
  const portalLink = portalToken ? `${window.location.origin}/portal/${portalToken}` : "";

  if (!match || clientId === null) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setLocation("/clients")}
          >
            <ArrowRight className="h-4 w-4 rtl:mr-2 ml-2" />
            الرجوع
          </Button>
          <Card className="card-gold">
            <CardContent className="p-6 text-muted-foreground">العميل غير موجود</CardContent>
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
              {clientLoading ? "..." : (client?.name ?? "")}
            </h1>
            <p className="text-muted-foreground mt-1">تفاصيل العميل والقضايا والمستندات</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/clients")}
          >
            <ArrowRight className="h-4 w-4 rtl:mr-2 ml-2" />
            الرجوع
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-gold" />
                بوابة العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                <Input value={portalEnabled && portalLink ? portalLink : ""} readOnly placeholder="لم يتم تفعيل بوابة العميل بعد" />
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="btn-gold"
                    disabled={portalGenerate.isPending || clientLoading}
                    onClick={async () => {
                      if (!clientId) return;
                      await portalGenerate.mutateAsync({ clientId });
                    }}
                  >
                    توليد رابط
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!portalEnabled || !portalLink}
                    onClick={async () => {
                      if (!portalLink) return;
                      await navigator.clipboard.writeText(portalLink);
                      toast.success("تم نسخ رابط البوابة");
                    }}
                  >
                    <Copy className="h-4 w-4 rtl:mr-2 ml-2" />
                    نسخ
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!portalEnabled || portalDisable.isPending || clientLoading}
                    onClick={async () => {
                      if (!clientId) return;
                      await portalDisable.mutateAsync({ clientId });
                    }}
                  >
                    <ShieldOff className="h-4 w-4 rtl:mr-2 ml-2" />
                    تعطيل
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                مشاركة الرابط تمنح العميل صلاحية عرض بياناته فقط (Read-only).
              </p>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gold" />
                قضايا العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {casesLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </>
              ) : (cases?.length ?? 0) > 0 ? (
                cases!.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          رقم القضية: {c.caseNumber}
                        </p>
                      </div>
                      <Badge variant="outline" className={caseStatusColors[String(c.status)] ?? ""}
                      >
                        {caseStatusLabels[String(c.status)] ?? String(c.status)}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                  لا توجد قضايا لهذا العميل
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gold" />
                مستندات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documentsLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </>
              ) : (documents?.length ?? 0) > 0 ? (
                documents!.map((d) => (
                  <div key={d.id} className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{d.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className={documentTypeColors[String(d.type)] ?? ""}
                          >
                            {documentTypeLabels[String(d.type)] ?? String(d.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(d.createdAt as any).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (d.fileUrl) {
                            window.open(d.fileUrl, "_blank");
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                  لا توجد مستندات لهذا العميل
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
