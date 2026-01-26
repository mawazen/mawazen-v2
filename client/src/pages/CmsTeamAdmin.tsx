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
import { Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function CmsTeamAdmin() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.cms.teamList.useQuery();
  const create = trpc.cms.teamCreate.useMutation();
  const update = trpc.cms.teamUpdate.useMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [editId, setEditId] = useState<number | null>(null);
  const editItem = useMemo(() => (data ?? []).find((x) => x.id === editId) ?? null, [data, editId]);

  const resetCreate = () => {
    setName("");
    setTitle("");
    setBio("");
    setAvatarUrl("");
    setSortOrder(0);
    setIsActive(true);
  };

  const onCreate = async () => {
    if (!name.trim()) {
      toast.error("الرجاء إدخال الاسم");
      return;
    }

    try {
      await create.mutateAsync({
        name,
        title: title.trim() ? title : null,
        bio: bio.trim() ? bio : null,
        avatarUrl: avatarUrl.trim() ? avatarUrl : null,
        sortOrder,
        isActive,
      });
      toast.success("تم إضافة عضو للفريق");
      setCreateOpen(false);
      resetCreate();
      await utils.cms.teamList.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر إضافة عضو");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة فريق الموقع</h1>
            <p className="text-muted-foreground">فريق العمل الظاهر في الموقع العام.</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 rtl:mr-2 ml-2" />
                إضافة عضو
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة عضو فريق</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>الاسم</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>المنصب/الصفة (اختياري)</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>نبذة (اختياري)</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>رابط الصورة (اختياري)</Label>
                    <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>ترتيب العرض</Label>
                    <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value || 0))} />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <div className="font-medium">إظهار العضو</div>
                    <div className="text-xs text-muted-foreground">إظهار/إخفاء العضو في الموقع العام</div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
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
              <Users className="h-5 w-5 text-gold" />
              الفريق
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">جاري التحميل...</div>
            ) : data && data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>المنصب</TableHead>
                    <TableHead>الترتيب</TableHead>
                    <TableHead>نشط</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.title ?? "—"}</TableCell>
                      <TableCell>{m.sortOrder ?? 0}</TableCell>
                      <TableCell>{m.isActive ? "نعم" : "لا"}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={editId === m.id} onOpenChange={(open) => setEditId(open ? m.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              تعديل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>تعديل عضو</DialogTitle>
                            </DialogHeader>
                            <EditTeamForm
                              item={editItem}
                              saving={update.isPending}
                              onSave={async (payload) => {
                                if (!editItem) return;
                                await update.mutateAsync({ id: editItem.id, ...payload });
                                toast.success("تم حفظ التعديلات");
                                setEditId(null);
                                await utils.cms.teamList.invalidate();
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
              <div className="text-muted-foreground">لا يوجد فريق بعد.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EditTeamForm({
  item,
  saving,
  onSave,
}: {
  item: any;
  saving: boolean;
  onSave: (data: {
    name?: string;
    title?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setName(item?.name ?? "");
    setTitle(item?.title ?? "");
    setBio(item?.bio ?? "");
    setAvatarUrl(item?.avatarUrl ?? "");
    setSortOrder(item?.sortOrder ?? 0);
    setIsActive(Boolean(item?.isActive ?? true));
  }, [item?.id]);

  if (!item) {
    return <div className="text-muted-foreground">العنصر غير موجود</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>الاسم</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>المنصب/الصفة (اختياري)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>نبذة (اختياري)</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>رابط الصورة (اختياري)</Label>
          <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>ترتيب العرض</Label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value || 0))} />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
        <div>
          <div className="font-medium">إظهار العضو</div>
          <div className="text-xs text-muted-foreground">إظهار/إخفاء العضو في الموقع العام</div>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <Button
        className="btn-gold"
        onClick={() =>
          onSave({
            name,
            title: title.trim() ? title : null,
            bio: bio.trim() ? bio : null,
            avatarUrl: avatarUrl.trim() ? avatarUrl : null,
            sortOrder,
            isActive,
          })
        }
        disabled={saving}
      >
        {saving ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </div>
  );
}
