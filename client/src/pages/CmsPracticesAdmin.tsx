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
import { BookOpen, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function CmsPracticesAdmin() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.cms.practicesList.useQuery();
  const create = trpc.cms.practicesCreate.useMutation();
  const update = trpc.cms.practicesUpdate.useMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [editId, setEditId] = useState<number | null>(null);
  const editItem = useMemo(() => (data ?? []).find((x) => x.id === editId) ?? null, [data, editId]);

  const resetCreate = () => {
    setTitle("");
    setDescription("");
    setSortOrder(0);
    setIsActive(true);
  };

  const onCreate = async () => {
    if (!title.trim()) {
      toast.error("الرجاء إدخال العنوان");
      return;
    }

    try {
      await create.mutateAsync({
        title,
        description: description.trim() ? description : null,
        sortOrder,
        isActive,
      });
      toast.success("تمت إضافة الممارسة");
      setCreateOpen(false);
      resetCreate();
      await utils.cms.practicesList.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر إضافة الممارسة");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة الممارسات</h1>
            <p className="text-muted-foreground">التخصصات/الممارسات الظاهرة في الموقع العام.</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 rtl:mr-2 ml-2" />
                إضافة ممارسة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة ممارسة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>الوصف (اختياري)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>ترتيب العرض</Label>
                    <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value || 0))} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div>
                      <div className="font-medium">نشر</div>
                      <div className="text-xs text-muted-foreground">إظهار/إخفاء في الموقع العام</div>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="btn-gold flex-1" onClick={onCreate} disabled={create.isPending}>
                    {create.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      resetCreate();
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
              <BookOpen className="h-5 w-5 text-gold" />
              الممارسات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">جاري التحميل...</div>
            ) : data && data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الترتيب</TableHead>
                    <TableHead>نشط</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.title}</div>
                        {p.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[520px]">
                            {p.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{p.sortOrder ?? 0}</TableCell>
                      <TableCell>{p.isActive ? "نعم" : "لا"}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={editId === p.id} onOpenChange={(open) => setEditId(open ? p.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              تعديل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>تعديل ممارسة</DialogTitle>
                            </DialogHeader>
                            <EditPracticeForm
                              item={editItem}
                              saving={update.isPending}
                              onSave={async (payload) => {
                                if (!editItem) return;
                                await update.mutateAsync({ id: editItem.id, ...payload });
                                toast.success("تم حفظ التعديلات");
                                setEditId(null);
                                await utils.cms.practicesList.invalidate();
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-muted-foreground">لا توجد ممارسات بعد.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EditPracticeForm({
  item,
  saving,
  onSave,
}: {
  item: any;
  saving: boolean;
  onSave: (data: { title?: string; description?: string | null; sortOrder?: number; isActive?: boolean }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setTitle(item?.title ?? "");
    setDescription(item?.description ?? "");
    setSortOrder(item?.sortOrder ?? 0);
    setIsActive(Boolean(item?.isActive ?? true));
  }, [item?.id]);

  if (!item) {
    return <div className="text-muted-foreground">العنصر غير موجود</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>العنوان</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>الوصف (اختياري)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>ترتيب العرض</Label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value || 0))} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
          <div>
            <div className="font-medium">نشر</div>
            <div className="text-xs text-muted-foreground">إظهار/إخفاء في الموقع العام</div>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <Button
        className="btn-gold"
        onClick={() => onSave({ title, description: description.trim() ? description : null, sortOrder, isActive })}
        disabled={saving}
      >
        {saving ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </div>
  );
}
