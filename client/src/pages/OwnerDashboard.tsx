import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Crown, RefreshCw, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function OwnerDashboard() {
  const [, setLocation] = useLocation();
  const [range, setRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const [query, setQuery] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");

  const isOwnerQuery = trpc.auth.isOwner.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isOwner = isOwnerQuery.data === true;

  const overviewQuery = trpc.owner.overview.useQuery(undefined, {
    enabled: isOwner,
    retry: false,
  });

  const statsQuery = trpc.owner.stats.useQuery(
    { range },
    {
      enabled: isOwner,
      retry: false,
    }
  );

  const usersQuery = trpc.owner.users.list.useQuery(
    query.trim() ? { query: query.trim() } : undefined,
    {
      enabled: isOwner,
      retry: false,
    }
  );

  const promoCodeQuery = trpc.owner.promoCode.get.useQuery(undefined, {
    enabled: isOwner,
    retry: false,
  });

  const promoCodeSet = trpc.owner.promoCode.set.useMutation({
    onSuccess: async () => {
      await promoCodeQuery.refetch();
    },
  });

  const promoCodeValue = promoCodeQuery.data?.promoCode ?? null;

  const usersByPlan = overviewQuery.data?.usersByPlan;

  const rows = useMemo(() => {
    const list = usersQuery.data ?? [];
    return list.slice(0, 50);
  }, [usersQuery.data]);

  const stats = statsQuery.data;

  useEffect(() => {
    if (promoCodeInput !== "") return;
    const v = promoCodeQuery.data?.promoCode;
    if (typeof v === "string") setPromoCodeInput(v);
  }, [promoCodeQuery.data, promoCodeInput]);

  if (isOwnerQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Crown className="h-7 w-7 text-gold" />
            <h1 className="text-2xl font-bold text-foreground">لوحة تحكم المالك</h1>
          </div>
          <Card className="card-gold">
            <CardContent className="p-6 text-muted-foreground">جارٍ التحميل...</CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!isOwner) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Crown className="h-7 w-7 text-gold" />
            <h1 className="text-2xl font-bold text-foreground">لوحة تحكم المالك</h1>
          </div>
          <Card className="card-gold">
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">غير مصرح لك بالدخول لهذه الصفحة.</p>
              <Button className="btn-gold" onClick={() => setLocation("/dashboard")}>العودة للوحة التحكم</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-7 w-7 text-gold" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">لوحة تحكم المالك</h1>
              <p className="text-sm text-muted-foreground">إحصائيات عامة للتطبيق (Owner Only)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg text-foreground"
            >
              <option value="week">أسبوع</option>
              <option value="month">شهر</option>
              <option value="quarter">ربع سنة</option>
              <option value="year">سنة</option>
            </select>

            <Button
              variant="outline"
              className="border-gold/30 hover:border-gold/50"
              onClick={() => {
                overviewQuery.refetch();
                statsQuery.refetch();
                usersQuery.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">المستخدمون</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-foreground">
              {stats?.users.total ?? 0}
              <div className="text-xs text-muted-foreground mt-2">نشط: {stats?.users.active ?? 0}</div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">المنظمات</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-foreground">{stats?.organizations.total ?? 0}</CardContent>
          </Card>

          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">القضايا</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-foreground">
              {stats?.cases.total ?? 0}
              <div className="text-xs text-muted-foreground mt-2">نشط: {stats?.cases.active ?? 0}</div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">الإيرادات (مدفوعة)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-foreground">
              {stats?.invoices.paidAmount ?? 0}
            </CardContent>
          </Card>
        </div>

        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" />
              توزيع المستخدمين حسب الخطة
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge className="bg-gold/20 text-gold border-gold/30">
              فردي: {usersByPlan?.individual ?? 0}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              مكتب: {usersByPlan?.law_firm ?? 0}
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              منشأة: {usersByPlan?.enterprise ?? 0}
            </Badge>
          </CardContent>
        </Card>

        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold" />
              Promo Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              الكود الحالي: <span className="font-mono">{promoCodeValue ?? "—"}</span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="PROMO2026"
                className="max-w-sm"
              />
              <Button
                className="btn-gold"
                disabled={promoCodeSet.isPending}
                onClick={() => {
                  promoCodeSet.mutate({ promoCode: promoCodeInput.trim() ? promoCodeInput.trim() : null });
                }}
              >
                حفظ
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gold">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" />
              المستخدمون (آخر 50)
            </CardTitle>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث بالاسم/الإيميل/الهاتف/openId"
              className="max-w-sm"
            />
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>openId</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name ?? "-"}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        {u.isActive ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">نشط</Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">غير نشط</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.openId}</TableCell>
                    </TableRow>
                  ))}

                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        لا يوجد بيانات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
