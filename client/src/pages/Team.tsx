import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  Mail,
  Calendar,
  MoreVertical,
  Crown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  admin: "مدير",
  lawyer: "محامي",
  assistant: "مساعد",
  client: "عميل",
};

const roleColors: Record<string, string> = {
  admin: "bg-gold/20 text-gold border-gold/30",
  lawyer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  assistant: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  client: "bg-green-500/20 text-green-400 border-green-500/30",
};

const roleIcons: Record<string, React.ElementType> = {
  admin: Crown,
  lawyer: Briefcase,
  assistant: Users,
  client: Users,
};

export default function Team() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.team.list.useQuery();
  const addMember = trpc.team.addMember.useMutation({
    onSuccess: async () => {
      toast.success("تم إضافة العضو بنجاح");
      await utils.team.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة العضو");
    },
  });

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [memberForm, setMemberForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    role: "lawyer" as "lawyer" | "assistant" | "client",
  });

  const getInitials = (name: string | null) => {
    if (!name) return "؟";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-7 w-7 text-gold" />
              إدارة الفريق
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة أعضاء الفريق والصلاحيات
            </p>
          </div>

          <Button
            className="btn-gold"
            onClick={() => setIsAddOpen(true)}
          >
            <UserPlus className="h-4 w-4 rtl:mr-2 ml-2" />
            دعوة عضو
          </Button>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عضو جديد</DialogTitle>
              <DialogDescription>
                سيتم إضافة العضو ضمن نفس الحساب، مع تطبيق حد المقاعد حسب الباقة.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">الاسم</Label>
                <Input
                  id="member-name"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="اسم العضو"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-email">البريد الإلكتروني (اختياري)</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  placeholder="example@domain.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-phone">رقم الهاتف (اختياري)</Label>
                <Input
                  id="member-phone"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label>الدور</Label>
                <Select
                  value={memberForm.role}
                  onValueChange={(value) =>
                    setMemberForm({
                      ...memberForm,
                      role: value as "lawyer" | "assistant" | "client",
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lawyer">محامي</SelectItem>
                    <SelectItem value="assistant">مساعد</SelectItem>
                    <SelectItem value="client">عميل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={addMember.isPending}
              >
                إلغاء
              </Button>
              <Button
                className="btn-gold"
                onClick={async () => {
                  if (!memberForm.name.trim()) {
                    toast.error("يرجى إدخال الاسم");
                    return;
                  }
                  await addMember.mutateAsync({
                    name: memberForm.name.trim(),
                    email: memberForm.email.trim() ? memberForm.email.trim() : null,
                    phone: memberForm.phone.trim() ? memberForm.phone.trim() : null,
                    role: memberForm.role,
                  });
                  setIsAddOpen(false);
                  setMemberForm({ name: "", email: "", phone: "", role: "lawyer" });
                }}
                disabled={addMember.isPending}
              >
                {addMember.isPending ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الأعضاء</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {users?.length ?? 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المديرون</p>
                  <p className="text-2xl font-bold text-gold mt-1">
                    {users?.filter((u) => u.role === "admin").length ?? 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المستخدمون</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    {users?.filter((u) => u.role === "lawyer" || u.role === "assistant").length ?? 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="text-lg">أعضاء الفريق</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role];
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50 hover:border-gold/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-gold/20">
                          <AvatarFallback className="bg-gold/10 text-gold font-bold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {user.name || "مستخدم"}
                            </h3>
                            <Badge
                              variant="outline"
                              className={roleColors[user.role]}
                            >
                              <RoleIcon className="h-3 w-3 ml-1" />
                              {roleLabels[user.role]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            {user.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              انضم{" "}
                              {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">
                            آخر تسجيل دخول
                          </p>
                          <p className="text-sm text-foreground">
                            {new Date(user.lastSignedIn).toLocaleDateString("ar-SA")}
                          </p>
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
                                toast.info("ميزة تعديل الصلاحيات قيد التطوير")
                              }
                            >
                              <Shield className="h-4 w-4 rtl:mr-2 ml-2" />
                              تعديل الصلاحيات
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info("ميزة عرض النشاط قيد التطوير")
                              }
                            >
                              <Briefcase className="h-4 w-4 rtl:mr-2 ml-2" />
                              عرض النشاط
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>لا يوجد أعضاء في الفريق</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles & Permissions Info */}
        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold" />
              الأدوار والصلاحيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-5 w-5 text-gold" />
                  <h4 className="font-semibold text-foreground">مدير</h4>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• إدارة جميع القضايا والعملاء</li>
                  <li>• إنشاء وتعديل الفواتير</li>
                  <li>• إدارة أعضاء الفريق</li>
                  <li>• الوصول للتقارير والإحصائيات</li>
                  <li>• تعديل إعدادات النظام</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-blue-400" />
                  <h4 className="font-semibold text-foreground">مستخدم</h4>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• عرض القضايا المخصصة له</li>
                  <li>• إضافة ملاحظات ومستندات</li>
                  <li>• استخدام المساعد الذكي</li>
                  <li>• عرض التقويم والمواعيد</li>
                  <li>• إدارة المهام الخاصة به</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
