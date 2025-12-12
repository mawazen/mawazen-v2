import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  User,
  Briefcase,
  MapPin,
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

const clientTypeLabels: Record<string, string> = {
  individual: "فرد",
  company: "شركة",
  government: "جهة حكومية",
};

const clientTypeIcons: Record<string, React.ElementType> = {
  individual: User,
  company: Building2,
  government: Building2,
};

export default function Clients() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery({
    search: search || undefined,
  });

  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة العميل بنجاح");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ في إضافة العميل");
    },
  });

  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العميل");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ في حذف العميل");
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    type: "individual" as "individual" | "company" | "government",
    email: "",
    phone: "",
    secondaryPhone: "",
    nationalId: "",
    commercialRegister: "",
    address: "",
    city: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      nameEn: "",
      type: "individual",
      email: "",
      phone: "",
      secondaryPhone: "",
      nationalId: "",
      commercialRegister: "",
      address: "",
      city: "",
      notes: "",
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("يرجى إدخال اسم العميل");
      return;
    }
    createClient.mutate({
      ...formData,
      email: formData.email || null,
      phone: formData.phone || null,
      secondaryPhone: formData.secondaryPhone || null,
      nationalId: formData.nationalId || null,
      commercialRegister: formData.commercialRegister || null,
      address: formData.address || null,
      city: formData.city || null,
      notes: formData.notes || null,
      nameEn: formData.nameEn || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-7 w-7 text-gold" />
              إدارة العملاء
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة بيانات العملاء والتواصل معهم
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 ml-2" />
                عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة عميل جديد</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>الاسم بالعربية *</Label>
                  <Input
                    placeholder="اسم العميل"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية</Label>
                  <Input
                    placeholder="Client name"
                    dir="ltr"
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع العميل</Label>
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
                      {Object.entries(clientTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الجوال</Label>
                  <Input
                    type="tel"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم جوال إضافي</Label>
                  <Input
                    type="tel"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    value={formData.secondaryPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, secondaryPhone: e.target.value })
                    }
                  />
                </div>
                {formData.type === "individual" ? (
                  <div className="space-y-2">
                    <Label>رقم الهوية الوطنية</Label>
                    <Input
                      placeholder="رقم الهوية"
                      dir="ltr"
                      value={formData.nationalId}
                      onChange={(e) =>
                        setFormData({ ...formData, nationalId: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>السجل التجاري</Label>
                    <Input
                      placeholder="رقم السجل التجاري"
                      dir="ltr"
                      value={formData.commercialRegister}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commercialRegister: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input
                    placeholder="المدينة"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>العنوان</Label>
                  <Input
                    placeholder="العنوان التفصيلي"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    placeholder="ملاحظات إضافية..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
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
                  disabled={createClient.isPending}
                >
                  {createClient.isPending ? "جاري الإضافة..." : "إضافة العميل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="card-gold">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في العملاء..."
                className="pr-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="card-gold">
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : clients && clients.length > 0 ? (
            clients.map((client) => {
              const TypeIcon = clientTypeIcons[client.type];
              return (
                <Card
                  key={client.id}
                  className="card-gold hover:border-gold/40 transition-all cursor-pointer"
                  onClick={() => setLocation(`/clients/${client.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                          <TypeIcon className="h-6 w-6 text-gold" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {client.name}
                          </h3>
                          <Badge variant="outline" className="mt-1">
                            {clientTypeLabels[client.type]}
                          </Badge>
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
                              setLocation(`/clients/${client.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
                                deleteClient.mutate({ id: client.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 text-sm">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span dir="ltr" className="truncate">
                            {client.email}
                          </span>
                        </div>
                      )}
                      {client.city && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{client.city}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        <span>
                          {new Date(client.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>
                      {(client.totalDue ?? 0) > 0 && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                          مستحقات: {((client.totalDue ?? 0) / 100).toLocaleString("ar-SA")} ر.س
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="card-gold col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  لا يوجد عملاء
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  ابدأ بإضافة عميل جديد
                </p>
                <Button className="btn-gold" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عميل
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
