import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Users,
  Receipt,
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = {
  gold: "#D4AF37",
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#a855f7",
  orange: "#f97316",
  cyan: "#06b6d4",
};

const caseTypeData = [
  { name: "تجاري", value: 35, color: COLORS.blue },
  { name: "جنائي", value: 20, color: COLORS.red },
  { name: "عمالي", value: 25, color: COLORS.green },
  { name: "أحوال شخصية", value: 15, color: COLORS.purple },
  { name: "إداري", value: 5, color: COLORS.orange },
];

const monthlyData = [
  { month: "يناير", cases: 12, revenue: 45000 },
  { month: "فبراير", cases: 15, revenue: 52000 },
  { month: "مارس", cases: 18, revenue: 61000 },
  { month: "أبريل", cases: 14, revenue: 48000 },
  { month: "مايو", cases: 22, revenue: 78000 },
  { month: "يونيو", cases: 19, revenue: 65000 },
];

const caseOutcomeData = [
  { name: "مكسوبة", value: 65, color: COLORS.green },
  { name: "خاسرة", value: 15, color: COLORS.red },
  { name: "تسوية", value: 20, color: COLORS.gold },
];

export default function Analytics() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const winRate = stats?.winRate ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-gold" />
            التحليلات والتقارير
          </h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على أداء المكتب القانوني
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نسبة النجاح</p>
                  <p className="text-3xl font-bold text-gold mt-1">{winRate}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+5% عن الشهر الماضي</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">القضايا النشطة</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats?.activeCases ?? 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+3 قضايا جديدة</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">العملاء</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats?.totalClients ?? 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+8 هذا الشهر</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الإيرادات</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {((stats?.totalRevenue ?? 0) / 100000).toFixed(0)}K
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+12% هذا الشهر</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Cases & Revenue */}
          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="text-lg">القضايا والإيرادات الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#888" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="cases"
                      name="القضايا"
                      fill={COLORS.gold}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      name="الإيرادات"
                      fill={COLORS.blue}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Case Types Distribution */}
          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="text-lg">توزيع أنواع القضايا</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={caseTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {caseTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Case Outcomes */}
          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="text-lg">نتائج القضايا</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={caseOutcomeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {caseOutcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="card-gold lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">مؤشرات الأداء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      معدل إغلاق القضايا
                    </span>
                    <span className="text-sm font-medium text-foreground">78%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full"
                      style={{ width: "78%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      رضا العملاء
                    </span>
                    <span className="text-sm font-medium text-foreground">92%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: "92%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      تحصيل المستحقات
                    </span>
                    <span className="text-sm font-medium text-foreground">85%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: "85%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      الالتزام بالمواعيد
                    </span>
                    <span className="text-sm font-medium text-foreground">95%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: "95%" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قضايا مكسوبة</p>
                  <p className="text-2xl font-bold text-green-400">
                    {Math.round((stats?.totalCases ?? 0) * 0.65)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قيد المعالجة</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {stats?.activeCases ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Scale className="h-7 w-7 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تسويات</p>
                  <p className="text-2xl font-bold text-gold">
                    {Math.round((stats?.totalCases ?? 0) * 0.2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
