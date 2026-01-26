import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  MoreVertical,
  Plus,
  Search,
  Wallet,
  Trash2,
} from "lucide-react";

type ProjectStatus = "new" | "in_progress" | "on_hold" | "completed" | "cancelled";

type ProjectPriority = "low" | "medium" | "high" | "urgent";

const statusLabel: Record<ProjectStatus, string> = {
  new: "جديد",
  in_progress: "قيد التنفيذ",
  on_hold: "متوقف",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const statusBadgeClass: Record<ProjectStatus, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  on_hold: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const priorityLabel: Record<ProjectPriority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

export default function ServiceProjects() {
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: projects, isLoading } = trpc.serviceProjects.list.useQuery(
    status === "all" ? { search: search || undefined } : { status, search: search || undefined }
  );

  const { data: services } = trpc.services.adminList.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: cases } = trpc.cases.list.useQuery();

  const serviceTitleById = useMemo(() => {
    const map = new Map<number, string>();
    (services ?? []).forEach((s) => map.set(s.id, s.title));
    return map;
  }, [services]);

  const clientNameById = useMemo(() => {
    const map = new Map<number, string>();
    (clients ?? []).forEach((c: any) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const caseTitleById = useMemo(() => {
    const map = new Map<number, string>();
    (cases ?? []).forEach((c: any) => map.set(c.id, c.title));
    return map;
  }, [cases]);

  const createProject = trpc.serviceProjects.create.useMutation({
    onSuccess: async () => {
      toast.success("تم إنشاء مشروع الخدمة");
      setCreateOpen(false);
      await utils.serviceProjects.list.invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر إنشاء مشروع الخدمة"),
  });

  const updateProject = trpc.serviceProjects.update.useMutation({
    onSuccess: async () => {
      await utils.serviceProjects.list.invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر تحديث مشروع الخدمة"),
  });

  const deleteProject = trpc.serviceProjects.delete.useMutation({
    onSuccess: async () => {
      toast.success("تم حذف مشروع الخدمة");
      await utils.serviceProjects.list.invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر حذف مشروع الخدمة"),
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    serviceCatalogId: "none" as string,
    clientId: "none" as string,
    caseId: "none" as string,
    priority: "medium" as ProjectPriority,
    status: "new" as ProjectStatus,
    dueDate: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      serviceCatalogId: "none",
      clientId: "none",
      caseId: "none",
      priority: "medium",
      status: "new",
      dueDate: "",
    });
  };

  const parseDate = (v: string) => {
    const s = (v ?? "").trim();
    if (!s) return null;
    const d = new Date(`${s}T00:00:00`);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const expensesQuery = trpc.serviceProjects.expensesList.useQuery(
    { serviceProjectId: selectedProjectId ?? 0 },
    { enabled: selectedProjectId != null }
  );

  const createExpense = trpc.serviceProjects.expensesCreate.useMutation({
    onSuccess: async () => {
      toast.success("تمت إضافة المصروف");
      await expensesQuery.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر إضافة المصروف"),
  });

  const deleteExpense = trpc.serviceProjects.expensesDelete.useMutation({
    onSuccess: async () => {
      toast.success("تم حذف المصروف");
      await expensesQuery.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر حذف المصروف"),
  });

  const [expenseForm, setExpenseForm] = useState({ amount: 0, description: "", expenseDate: "" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-gold" />
              مشاريع الخدمات القانونية
            </h1>
            <p className="text-muted-foreground mt-1">إدارة الخدمات القانونية كمشاريع مرتبطة بالعميل/القضية.</p>
          </div>

          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 rtl:mr-2 ml-2" />
                مشروع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>إنشاء مشروع خدمة</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>عنوان المشروع *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الخدمة (من الكتالوج)</Label>
                    <Select value={form.serviceCatalogId} onValueChange={(v) => setForm({ ...form, serviceCatalogId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختياري" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون</SelectItem>
                        {(services ?? []).map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>العميل</Label>
                    <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختياري" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون</SelectItem>
                        {(clients ?? []).map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>القضية</Label>
                    <Select value={form.caseId} onValueChange={(v) => setForm({ ...form, caseId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختياري" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون</SelectItem>
                        {(cases ?? []).map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>تاريخ الاستحقاق</Label>
                    <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الأولوية</Label>
                    <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{priorityLabel.low}</SelectItem>
                        <SelectItem value="medium">{priorityLabel.medium}</SelectItem>
                        <SelectItem value="high">{priorityLabel.high}</SelectItem>
                        <SelectItem value="urgent">{priorityLabel.urgent}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{statusLabel.new}</SelectItem>
                        <SelectItem value="in_progress">{statusLabel.in_progress}</SelectItem>
                        <SelectItem value="on_hold">{statusLabel.on_hold}</SelectItem>
                        <SelectItem value="completed">{statusLabel.completed}</SelectItem>
                        <SelectItem value="cancelled">{statusLabel.cancelled}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    إلغاء
                  </Button>
                  <Button
                    className="btn-gold"
                    disabled={createProject.isPending}
                    onClick={async () => {
                      if (!form.title.trim()) {
                        toast.error("يرجى إدخال عنوان المشروع");
                        return;
                      }
                      await createProject.mutateAsync({
                        title: form.title.trim(),
                        description: form.description.trim() ? form.description.trim() : null,
                        serviceCatalogId: form.serviceCatalogId === "none" ? null : Number(form.serviceCatalogId),
                        clientId: form.clientId === "none" ? null : Number(form.clientId),
                        caseId: form.caseId === "none" ? null : Number(form.caseId),
                        priority: form.priority,
                        status: form.status,
                        dueDate: parseDate(form.dueDate),
                      } as any);
                    }}
                  >
                    إنشاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="card-gold">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في مشاريع الخدمات..."
                  className="pr-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة بالحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="new">{statusLabel.new}</SelectItem>
                  <SelectItem value="in_progress">{statusLabel.in_progress}</SelectItem>
                  <SelectItem value="on_hold">{statusLabel.on_hold}</SelectItem>
                  <SelectItem value="completed">{statusLabel.completed}</SelectItem>
                  <SelectItem value="cancelled">{statusLabel.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Dialog open={selectedProjectId != null} onOpenChange={(open) => setSelectedProjectId(open ? selectedProjectId : null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>مصروفات المشروع</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2 md:col-span-1">
                  <Label>المبلغ (هللة)</Label>
                  <Input
                    type="number"
                    value={expenseForm.amount || ""}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>الوصف</Label>
                  <Input
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>تاريخ المصروف</Label>
                <Input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                />
              </div>

              <Button
                className="btn-gold w-full"
                disabled={createExpense.isPending || !selectedProjectId}
                onClick={async () => {
                  if (!selectedProjectId) return;
                  if (!expenseForm.amount) {
                    toast.error("يرجى إدخال المبلغ");
                    return;
                  }
                  await createExpense.mutateAsync({
                    serviceProjectId: selectedProjectId,
                    amount: expenseForm.amount,
                    currency: "SAR",
                    description: expenseForm.description.trim() ? expenseForm.description.trim() : null,
                    expenseDate: parseDate(expenseForm.expenseDate),
                  } as any);
                  setExpenseForm({ amount: 0, description: "", expenseDate: "" });
                }}
              >
                إضافة مصروف
              </Button>

              <div className="space-y-2">
                {expensesQuery.isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (expensesQuery.data ?? []).length > 0 ? (
                  (expensesQuery.data ?? []).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">
                          {Number(e.amount ?? 0).toLocaleString("ar-SA")} هللة
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {e.description ?? "—"}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("حذف هذا المصروف؟")) {
                            deleteExpense.mutate({ id: e.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm">لا توجد مصروفات.</div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="card-gold">
                  <CardContent className="p-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : projects && projects.length > 0 ? (
            projects.map((p: any) => {
              const st = (p.status ?? "new") as ProjectStatus;
              const pr = (p.priority ?? "medium") as ProjectPriority;
              return (
                <Card key={p.id} className="card-gold hover:border-gold/40 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gold" />
                          <span className="truncate">{p.title}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className={statusBadgeClass[st]}>
                            {statusLabel[st]}
                          </Badge>
                          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20">
                            {priorityLabel[pr]}
                          </Badge>
                          {p.serviceCatalogId && (
                            <span className="text-xs text-muted-foreground">
                              خدمة: {serviceTitleById.get(p.serviceCatalogId) ?? `#${p.serviceCatalogId}`}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          {p.clientId && <div>عميل: {clientNameById.get(p.clientId) ?? `#${p.clientId}`}</div>}
                          {p.caseId && <div>قضية: {caseTitleById.get(p.caseId) ?? `#${p.caseId}`}</div>}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedProjectId(p.id)}>
                            <Wallet className="h-4 w-4 rtl:mr-2 ml-2" />
                            المصروفات
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateProject.mutate({ id: p.id, status: "in_progress" } as any)}>
                            تعيين: قيد التنفيذ
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateProject.mutate({ id: p.id, status: "completed" } as any)}>
                            تعيين: مكتمل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateProject.mutate({ id: p.id, status: "on_hold" } as any)}>
                            تعيين: متوقف
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateProject.mutate({ id: p.id, status: "cancelled" } as any)}>
                            تعيين: ملغي
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا المشروع؟")) {
                                deleteProject.mutate({ id: p.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 rtl:mr-2 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  {p.description && (
                    <CardContent>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{p.description}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })
          ) : (
            <Card className="card-gold">
              <CardContent className="p-10 text-center text-muted-foreground">
                لا توجد مشاريع خدمات
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
