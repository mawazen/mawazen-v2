import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("month");

  const reports = [
    {
      id: "financial",
      title: "التقرير المالي",
      description: "تقرير شامل عن الإيرادات والنفقات",
      icon: DollarSign,
      metrics: [
        { label: "إجمالي الإيرادات", value: "125,500 ر.س", change: "+15%" },
        { label: "إجمالي النفقات", value: "35,200 ر.س", change: "-5%" },
        { label: "الربح الصافي", value: "90,300 ر.س", change: "+22%" },
      ],
    },
    {
      id: "cases",
      title: "تقرير القضايا",
      description: "إحصائيات شاملة عن القضايا والنتائج",
      icon: FileText,
      metrics: [
        { label: "إجمالي القضايا", value: "156", change: "+8" },
        { label: "القضايا المكسوبة", value: "89", change: "57%" },
        { label: "القضايا الخاسرة", value: "32", change: "20%" },
      ],
    },
    {
      id: "performance",
      title: "تقرير الأداء",
      description: "تقييم أداء الفريق والمحامين",
      icon: TrendingUp,
      metrics: [
        { label: "متوسط الإنتاجية", value: "92%", change: "+5%" },
        { label: "رضا العملاء", value: "4.8/5", change: "+0.3" },
        { label: "معدل الاحتفاظ", value: "94%", change: "+2%" },
      ],
    },
    {
      id: "clients",
      title: "تقرير العملاء",
      description: "تحليل قاعدة العملاء والعلاقات",
      icon: Users,
      metrics: [
        { label: "إجمالي العملاء", value: "234", change: "+18" },
        { label: "عملاء جدد", value: "42", change: "+25%" },
        { label: "معدل التحويل", value: "28%", change: "+3%" },
      ],
    },
  ];

  const exportFormats = [
    { format: "PDF", icon: "📄" },
    { format: "Excel", icon: "📊" },
    { format: "CSV", icon: "📋" },
  ];

  const handleExport = (format: string) => {
    if (!selectedReport) {
      toast.error("يرجى اختيار تقرير أولاً");
      return;
    }
    toast.success(`تم تحميل التقرير بصيغة ${format}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-gold" />
            التقارير والتحليلات
          </h1>
          <p className="text-muted-foreground mt-2">
            تقارير شاملة عن أداء مكتبك القانوني
          </p>
        </div>

        {/* Filters */}
        <Card className="card-gold">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground block mb-2">
                  نطاق التاريخ
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg text-foreground"
                >
                  <option value="week">هذا الأسبوع</option>
                  <option value="month">هذا الشهر</option>
                  <option value="quarter">هذا الربع</option>
                  <option value="year">هذه السنة</option>
                  <option value="custom">مخصص</option>
                </select>
              </div>
              <Button className="bg-gold hover:bg-gold-light text-black font-semibold">
                <Filter className="h-4 w-4 ml-2" />
                تطبيق الفلاتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            const isSelected = selectedReport === report.id;
            return (
              <Card
                key={report.id}
                className={`card-gold cursor-pointer transition-all ${
                  isSelected ? "border-gold ring-2 ring-gold/50" : "hover:border-gold/50"
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gold/10 rounded-lg">
                        <Icon className="h-6 w-6 text-gold" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.metrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                      >
                        <span className="text-sm text-muted-foreground">
                          {metric.label}
                        </span>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {metric.value}
                          </p>
                          <p className="text-xs text-green-400">{metric.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Export Section */}
        {selectedReport && (
          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-gold" />
                تحميل التقرير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exportFormats.map((item) => (
                  <Button
                    key={item.format}
                    variant="outline"
                    className="border-gold/30 hover:border-gold/50 h-auto py-6 flex flex-col items-center gap-2"
                    onClick={() => handleExport(item.format)}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.format}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Reports */}
        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              التقارير المجدولة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">التقرير المالي الشهري</p>
                  <p className="text-sm text-muted-foreground">
                    يتم إرساله كل أول يوم من الشهر
                  </p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  مفعل
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">تقرير الأداء الأسبوعي</p>
                  <p className="text-sm text-muted-foreground">
                    يتم إرساله كل يوم الاثنين
                  </p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  مفعل
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">تقرير العملاء الربع سنوي</p>
                  <p className="text-sm text-muted-foreground">
                    يتم إرساله في نهاية كل ربع سنة
                  </p>
                </div>
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                  معطل
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Report Builder */}
        <Card className="card-gold">
          <CardHeader>
            <CardTitle>إنشاء تقرير مخصص</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                قم بإنشاء تقرير مخصص يناسب احتياجات مكتبك
              </p>
              <Button className="w-full bg-gold hover:bg-gold-light text-black font-semibold">
                إنشاء تقرير جديد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
