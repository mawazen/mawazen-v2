import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Briefcase,
  Users,
  Calendar,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Scale,
  ArrowUpLeft,
  ArrowDownLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
}) {
  return (
    <Card className="card-gold hover:scale-[1.02] transition-transform duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                {trendUp ? (
                  <ArrowUpLeft className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownLeft className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={`text-xs ${trendUp ? "text-green-500" : "text-red-500"}`}
                >
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-gold" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="card-gold">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="w-12 h-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

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

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } =
    trpc.dashboard.stats.useQuery();
  const { data: upcomingHearings, isLoading: hearingsLoading } =
    trpc.dashboard.upcomingHearings.useQuery();
  const { data: recentCases, isLoading: casesLoading } =
    trpc.dashboard.recentCases.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              مرحباً بك في قيد
            </h1>
            <p className="text-muted-foreground mt-1">
              نظرة عامة على أداء مكتبك القانوني
            </p>
          </div>
          <Button
            className="btn-gold"
            onClick={() => setLocation("/ai-assistant")}
          >
            <Scale className="h-4 w-4 ml-2" />
            المساعد الذكي
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="إجمالي القضايا"
                value={stats?.totalCases ?? 0}
                icon={Briefcase}
                subtitle={`${stats?.activeCases ?? 0} قضية نشطة`}
              />
              <StatCard
                title="العملاء"
                value={stats?.totalClients ?? 0}
                icon={Users}
              />
              <StatCard
                title="الجلسات القادمة"
                value={stats?.upcomingHearings ?? 0}
                icon={Calendar}
                subtitle="خلال 7 أيام"
              />
              <StatCard
                title="نسبة النجاح"
                value={`${stats?.winRate ?? 0}%`}
                icon={TrendingUp}
                trend="+5% هذا الشهر"
                trendUp={true}
              />
            </>
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="المهام المعلقة"
                value={stats?.pendingTasks ?? 0}
                icon={Clock}
              />
              <StatCard
                title="فواتير غير مدفوعة"
                value={stats?.unpaidInvoices ?? 0}
                icon={Receipt}
              />
              <StatCard
                title="إجمالي الإيرادات"
                value={`${((stats?.totalRevenue ?? 0) / 100).toLocaleString("ar-SA")} ر.س`}
                icon={CheckCircle2}
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Hearings */}
          <Card className="card-gold">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" />
                الجلسات القادمة
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/calendar")}
                className="text-gold hover:text-gold/80"
              >
                عرض الكل
              </Button>
            </CardHeader>
            <CardContent>
              {hearingsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : upcomingHearings && upcomingHearings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingHearings.slice(0, 5).map((hearing) => (
                    <div
                      key={hearing.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {hearing.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {hearing.location || "المحكمة"}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gold">
                          {new Date(hearing.hearingDate).toLocaleDateString(
                            "ar-SA"
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(hearing.hearingDate).toLocaleTimeString(
                            "ar-SA",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-3 opacity-50" />
                  <p>لا توجد جلسات قادمة</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Cases */}
          <Card className="card-gold">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gold" />
                أحدث القضايا
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/cases")}
                className="text-gold hover:text-gold/80"
              >
                عرض الكل
              </Button>
            </CardHeader>
            <CardContent>
              {casesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : recentCases && recentCases.length > 0 ? (
                <div className="space-y-3">
                  {recentCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                      onClick={() => setLocation(`/cases/${caseItem.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {caseItem.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {caseItem.caseNumber} •{" "}
                            {caseTypeLabels[caseItem.type] || caseItem.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className={priorityColors[caseItem.priority]}
                        >
                          {stageLabels[caseItem.stage] || caseItem.stage}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {statusLabels[caseItem.status] || caseItem.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mb-3 opacity-50" />
                  <p>لا توجد قضايا</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setLocation("/cases")}
                  >
                    إضافة قضية جديدة
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 hover:border-gold/50 hover:bg-gold/5"
                onClick={() => setLocation("/cases")}
              >
                <Briefcase className="h-6 w-6 text-gold" />
                <span>قضية جديدة</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 hover:border-gold/50 hover:bg-gold/5"
                onClick={() => setLocation("/clients")}
              >
                <Users className="h-6 w-6 text-gold" />
                <span>عميل جديد</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 hover:border-gold/50 hover:bg-gold/5"
                onClick={() => setLocation("/invoices")}
              >
                <Receipt className="h-6 w-6 text-gold" />
                <span>فاتورة جديدة</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 hover:border-gold/50 hover:bg-gold/5"
                onClick={() => setLocation("/ai-assistant")}
              >
                <Scale className="h-6 w-6 text-gold" />
                <span>استشارة ذكية</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
