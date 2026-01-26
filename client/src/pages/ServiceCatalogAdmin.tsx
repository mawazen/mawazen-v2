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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function ServiceCatalogAdmin() {
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.services.adminList.useQuery();
  const createService = trpc.services.adminCreate.useMutation();
  const updateService = trpc.services.adminUpdate.useMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [priceAmount, setPriceAmount] = useState(0);
  const [currency, setCurrency] = useState("SAR");
  const [isActive, setIsActive] = useState(true);

  const [editId, setEditId] = useState<number | null>(null);

  const editService = useMemo(() => {
    if (!services || editId == null) return null;
    return services.find((s) => s.id === editId) ?? null;
  }, [services, editId]);

  const resetCreateForm = () => {
    setTitle("");
    setDescription("");
    setDurationMinutes(60);
    setPriceAmount(0);
    setCurrency("SAR");
    setIsActive(true);
  };

  const onCreate = async () => {
    if (!title.trim()) {
      toast.error("الرجاء إدخال عنوان الخدمة");
      return;
    }

    try {
      await createService.mutateAsync({
        title,
        description: description.trim() ? description : null,
        durationMinutes,
        priceAmount,
        currency,
        isActive,
      });
      toast.success("تمت إضافة الخدمة");
      setCreateOpen(false);
      resetCreateForm();
      await utils.services.adminList.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "حدث خطأ أثناء إضافة الخدمة");
    }
  };

  const onToggleActive = async (id: number, value: boolean) => {
    try {
      await updateService.mutateAsync({ id, isActive: value });
      await utils.services.adminList.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر تحديث حالة الخدمة");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة الخدمات</h1>
            <p className="text-muted-foreground">أضف وعدّل الخدمات المعروضة للعملاء.</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 rtl:mr-2 ml-2" />
                إضافة خدمة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>إضافة خدمة</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>الوصف (اختياري)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>المدة (دقيقة)</Label>
                    <Input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value || 0))}
                      min={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السعر</Label>
                    <Input
                      type="number"
                      value={priceAmount}
                      onChange={(e) => setPriceAmount(Number(e.target.value || 0))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العملة</Label>
                    <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <div className="font-medium">إتاحة الخدمة</div>
                    <div className="text-xs text-muted-foreground">إظهار الخدمة في صفحة الخدمات العامة</div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <div className="flex gap-2">
                  <Button className="btn-gold flex-1" onClick={onCreate} disabled={createService.isPending}>
                    {createService.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      resetCreateForm();
                      setCreateOpen(false);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-gold" />
              كتالوج الخدمات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">جاري تحميل الخدمات...</div>
            ) : services && services.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الخدمة</TableHead>
                    <TableHead>المدة</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>نشطة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.title}</div>
                        {s.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[380px]">
                            {s.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{s.durationMinutes} دقيقة</TableCell>
                      <TableCell>
                        {s.priceAmount} {s.currency}
                      </TableCell>
                      <TableCell>
                        <Switch checked={Boolean(s.isActive)} onCheckedChange={(v) => onToggleActive(s.id, v)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={editId === s.id} onOpenChange={(open) => setEditId(open ? s.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              تعديل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>تعديل خدمة</DialogTitle>
                            </DialogHeader>

                            <EditServiceForm
                              service={editService}
                              onSave={async (data) => {
                                if (!editService) return;
                                await updateService.mutateAsync({ id: editService.id, ...data });
                                toast.success("تم تحديث الخدمة");
                                setEditId(null);
                                await utils.services.adminList.invalidate();
                              }}
                              saving={updateService.isPending}
                            />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-muted-foreground">لا توجد خدمات بعد.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EditServiceForm({
  service,
  saving,
  onSave,
}: {
  service: any;
  saving: boolean;
  onSave: (data: {
    title?: string;
    description?: string | null;
    durationMinutes?: number;
    priceAmount?: number;
    currency?: string;
    isActive?: boolean;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [priceAmount, setPriceAmount] = useState<number>(0);
  const [currency, setCurrency] = useState("SAR");
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    setTitle(service?.title ?? "");
    setDescription(service?.description ?? "");
    setDurationMinutes(service?.durationMinutes ?? 60);
    setPriceAmount(service?.priceAmount ?? 0);
    setCurrency(service?.currency ?? "SAR");
    setIsActive(Boolean(service?.isActive ?? true));
  }, [service?.id]);

  if (!service) {
    return <div className="text-muted-foreground">الخدمة غير موجودة</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>العنوان</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>الوصف (اختياري)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>المدة (دقيقة)</Label>
          <Input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value || 0))}
            min={5}
          />
        </div>
        <div className="space-y-2">
          <Label>السعر</Label>
          <Input
            type="number"
            value={priceAmount}
            onChange={(e) => setPriceAmount(Number(e.target.value || 0))}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label>العملة</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
        <div>
          <div className="font-medium">إتاحة الخدمة</div>
          <div className="text-xs text-muted-foreground">إظهار الخدمة في صفحة الخدمات العامة</div>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <div className="flex gap-2">
        <Button
          className="btn-gold flex-1"
          onClick={() =>
            onSave({
              title,
              description: description.trim() ? description : null,
              durationMinutes,
              priceAmount,
              currency,
              isActive,
            })
          }
          disabled={saving}
        >
          {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
        </Button>
      </div>
    </div>
  );
}
