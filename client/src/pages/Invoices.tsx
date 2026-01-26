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
  Receipt,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Printer,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  sent: "مرسلة",
  paid: "مدفوعة",
  partial: "مدفوعة جزئياً",
  overdue: "متأخرة",
  cancelled: "ملغاة",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const feeTypeLabels: Record<string, string> = {
  hourly: "بالساعة",
  fixed: "مبلغ ثابت",
  percentage: "نسبة مئوية",
  retainer: "أتعاب شهرية",
};

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: invoices, isLoading, refetch } = trpc.invoices.list.useQuery({
    status: statusFilter || undefined,
  });

  const { data: stats } = trpc.invoices.stats.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إنشاء الفاتورة رقم ${data.invoiceNumber}`);
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ في إنشاء الفاتورة");
    },
  });

  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الفاتورة");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ في حذف الفاتورة");
    },
  });

  const [formData, setFormData] = useState({
    clientId: 0,
    amount: 0,
    feeType: "fixed" as "hourly" | "fixed" | "percentage" | "retainer",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      clientId: 0,
      amount: 0,
      feeType: "fixed",
      description: "",
    });
  };

  const handleCreate = () => {
    if (!formData.clientId || !formData.amount) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createInvoice.mutate({
      ...formData,
      amount: formData.amount * 100, // Convert to cents
      description: formData.description || null,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-7 w-7 text-gold" />
              الفواتير والأتعاب
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة الفواتير والمدفوعات
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2" data-print-hide>
            <Button
              variant="outline"
              className="border-gold/30 hover:border-gold/50"
              onClick={() => window.print()}
              data-print-hide
            >
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="btn-gold">
                  <Plus className="h-4 w-4 ml-2" />
                  فاتورة جديدة
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المبلغ (ر.س) *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      dir="ltr"
                      value={formData.amount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نوع الأتعاب</Label>
                    <Select
                      value={formData.feeType}
                      onValueChange={(v: any) =>
                        setFormData({ ...formData, feeType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(feeTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المبلغ الأساسي</span>
                    <span>{formData.amount.toLocaleString("ar-SA")} ر.س</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">ضريبة القيمة المضافة (15%)</span>
                    <span>{(formData.amount * 0.15).toLocaleString("ar-SA")} ر.س</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border/50">
                    <span>الإجمالي</span>
                    <span className="text-gold">
                      {(formData.amount * 1.15).toLocaleString("ar-SA")} ر.س
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    placeholder="تفاصيل الفاتورة..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  className="btn-gold"
                  onClick={handleCreate}
                  disabled={createInvoice.isPending}
                >
                  {createInvoice.isPending ? "جاري الإنشاء..." : "إنشاء الفاتورة"}
                </Button>
              </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stats?.total ?? 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المدفوعة</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {stats?.paid ?? 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المعلقة</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">
                    {stats?.pending ?? 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المتأخرة</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {stats?.overdue ?? 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Card */}
        <Card className="card-gold">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات المحصلة</p>
                <p className="text-3xl font-bold text-gold mt-2">
                  {((stats?.paidAmount ?? 0) / 100).toLocaleString("ar-SA")} ر.س
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="text-green-400 text-sm">+12% هذا الشهر</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <Card className="card-gold">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="جميع الحالات" />
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
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <div className="grid gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="card-gold">
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : invoices && invoices.length > 0 ? (
            invoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="card-gold hover:border-gold/40 transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-gold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {invoice.invoiceNumber}
                          </h3>
                          <Badge
                            variant="outline"
                            className={statusColors[invoice.status]}
                          >
                            {statusLabels[invoice.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feeTypeLabels[invoice.feeType]} •{" "}
                          {new Date(invoice.createdAt).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-left">
                        <p className="text-2xl font-bold text-gold">
                          {((invoice.totalAmount ?? 0) / 100).toLocaleString("ar-SA")}
                        </p>
                        <p className="text-xs text-muted-foreground">ريال سعودي</p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="h-4 w-4 ml-2" />
                            تسجيل دفعة
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) {
                                deleteInvoice.mutate({ id: invoice.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-gold">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  لا توجد فواتير
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  ابدأ بإنشاء فاتورة جديدة
                </p>
                <Button className="btn-gold" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء فاتورة
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
