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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Clock,
  ListChecks,
  MoreVertical,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import type { ElementType } from "react";

const statusLabels: Record<string, string> = {
  pending: "معلقة",
  in_progress: "قيد التنفيذ",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-500 border-red-500/30",
};

const statusIcon: Record<string, ElementType> = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export default function Tasks() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
  });

  const filteredTasks = useMemo(() => {
    const list = tasks ?? [];
    const q = search.trim();
    if (!q) return list;
    return list.filter((t) => {
      const hay = `${t.title ?? ""} ${t.description ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [tasks, search]);

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المهمة");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إنشاء المهمة");
    },
  });

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast.error("تعذر تحديث المهمة");
    },
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المهمة");
      refetch();
    },
    onError: () => {
      toast.error("تعذر حذف المهمة");
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
    });
  };

  const handleCreate = () => {
    const title = formData.title.trim();
    if (!title) {
      toast.error("يرجى إدخال عنوان المهمة");
      return;
    }

    createTask.mutate({
      title,
      description: formData.description.trim() ? formData.description.trim() : null,
      dueDate: formData.dueDate ? new Date(`${formData.dueDate}T00:00:00`) : null,
      priority: formData.priority,
      caseId: null,
      assignedToId: null,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ListChecks className="h-7 w-7 text-gold" />
              المهام
            </h1>
            <p className="text-muted-foreground mt-1">إدارة مهام الفريق والمتابعة</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 ml-2" />
                مهمة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>العنوان *</Label>
                  <Input
                    placeholder="عنوان المهمة"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    placeholder="تفاصيل المهمة..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الأولوية</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v: any) => setFormData({ ...formData, priority: v })}
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
                    <Label>تاريخ الاستحقاق</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  className="btn-gold"
                  onClick={handleCreate}
                  disabled={createTask.isPending}
                >
                  إنشاء
                </Button>
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
                  placeholder="بحث في المهام..."
                  className="pr-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة بالحالة" />
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

              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة بالأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(priorityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="card-gold">
                  <CardContent className="p-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const StatusIcon = statusIcon[String(task.status)] ?? Circle;
              const statusLabel = statusLabels[String(task.status)] ?? String(task.status);
              const statusClass = statusColors[String(task.status)] ?? "";

              const priorityLabel = priorityLabels[String(task.priority)] ?? String(task.priority);
              const priorityClass = priorityColors[String(task.priority)] ?? "";

              const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString("ar-SA") : null;

              return (
                <Card key={task.id} className="card-gold hover:border-gold/40 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          <StatusIcon className="h-4 w-4 text-gold" />
                          <span className="truncate">{task.title}</span>
                        </CardTitle>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant="outline" className={statusClass}>
                            {statusLabel}
                          </Badge>
                          <Badge variant="outline" className={priorityClass}>
                            {priorityLabel}
                          </Badge>
                          {dueDate && (
                            <span className="text-xs text-muted-foreground">استحقاق: {dueDate}</span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              updateTask.mutate({ id: task.id, status: "pending" })
                            }
                          >
                            تعيين: معلقة
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateTask.mutate({ id: task.id, status: "in_progress" })
                            }
                          >
                            تعيين: قيد التنفيذ
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateTask.mutate({ id: task.id, status: "completed" })
                            }
                          >
                            تعيين: مكتملة
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateTask.mutate({ id: task.id, status: "cancelled" })
                            }
                          >
                            تعيين: ملغاة
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
                                deleteTask.mutate({ id: task.id });
                              }
                            }}
                          >
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent />
                </Card>
              );
            })
          ) : (
            <Card className="card-gold">
              <CardContent className="p-10 text-center text-muted-foreground">
                لا توجد مهام
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
