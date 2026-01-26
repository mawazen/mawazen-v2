import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLocation } from "wouter";

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

const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
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

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

export default function Cases() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: cases, isLoading, refetch } = trpc.cases.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const { data: clients } = trpc.clients.list.useQuery();

  const createCase = trpc.cases.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء القضية بنجاح");
      setIsCreateOpen(false);
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ في إنشاء القضية");
    },
  });

  const deleteCase = trpc.cases.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القضية");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ في حذف القضية");
    },
  });

  const [formData, setFormData] = useState({
    caseNumber: "",
    title: "",
    description: "",
    type: "commercial" as const,
    court: "",
    clientId: 0,
    priority: "medium" as const,
    opposingParty: "",
  });

  const handleCreate = () => {
    if (!formData.caseNumber || !formData.title || !formData.clientId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createCase.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-gold" />
              إدارة القضايا
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة ومتابعة جميع القضايا القانونية
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 rtl:mr-2 ml-2" />
                قضية جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء قضية جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>رقم القضية *</Label>
                  <Input
                    placeholder="مثال: 1446/123"
                    value={formData.caseNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, caseNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>العميل *</Label>
                  <Select
                    value={formData.clientId.toString()}
                    onValueChange={(v) =>
                      setFormData({ ...formData, clientId: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>عنوان القضية *</Label>
                  <Input
                    placeholder="عنوان مختصر للقضية"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع القضية</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: any) =>
                      setFormData({ ...formData, type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(caseTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الأولوية</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v: any) =>
                      setFormData({ ...formData, priority: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المحكمة</Label>
                  <Input
                    placeholder="اسم المحكمة"
                    value={formData.court}
                    onChange={(e) =>
                      setFormData({ ...formData, court: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الخصم</Label>
                  <Input
                    placeholder="اسم الخصم"
                    value={formData.opposingParty}
                    onChange={(e) =>
                      setFormData({ ...formData, opposingParty: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>الوصف</Label>
                  <Textarea
                    placeholder="وصف تفصيلي للقضية..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  className="btn-gold"
                  onClick={handleCreate}
                  disabled={createCase.isPending}
                >
                  {createCase.isPending ? "جاري الإنشاء..." : "إنشاء القضية"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="card-gold">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في القضايا..."
                  className="pr-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(caseTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <div className="grid gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="card-gold">
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : cases && cases.length > 0 ? (
            cases.map((caseItem) => (
              <Card
                key={caseItem.id}
                className="card-gold hover:border-gold/40 transition-all cursor-pointer"
                onClick={() => setLocation(`/cases/${caseItem.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                        <Briefcase className="h-6 w-6 text-gold" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-foreground">
                            {caseItem.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={statusColors[caseItem.status]}
                          >
                            {statusLabels[caseItem.status]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={priorityColors[caseItem.priority]}
                          >
                            {priorityLabels[caseItem.priority]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          رقم القضية: {caseItem.caseNumber} •{" "}
                          {caseTypeLabels[caseItem.type]}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          {caseItem.court && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {caseItem.court}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {stageLabels[caseItem.stage]}
                          </span>
                          {caseItem.nextHearingDate && (
                            <span className="flex items-center gap-1 text-gold">
                              <Calendar className="h-3 w-3" />
                              الجلسة القادمة:{" "}
                              {new Date(
                                caseItem.nextHearingDate
                              ).toLocaleDateString("ar-SA")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/cases/${caseItem.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 rtl:mr-2 ml-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/ai-assistant?caseId=${caseItem.id}`);
                          }}
                        >
                          <Briefcase className="h-4 w-4 rtl:mr-2 ml-2" />
                          تحليل بالذكاء الاصطناعي
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("هل أنت متأكد من حذف هذه القضية؟")) {
                              deleteCase.mutate({ id: caseItem.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 rtl:mr-2 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-gold">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Briefcase className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  لا توجد قضايا
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  ابدأ بإضافة قضية جديدة لإدارتها
                </p>
                <Button className="btn-gold" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 rtl:mr-2 ml-2" />
                  إضافة قضية
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
