import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
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
import { MessageSquareQuote, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function CmsTestimonialsAdmin() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.cms.testimonialsList.useQuery();
  const create = trpc.cms.testimonialsCreate.useMutation();
  const update = trpc.cms.testimonialsUpdate.useMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientTitle, setClientTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isPublished, setIsPublished] = useState(true);

  const [editId, setEditId] = useState<number | null>(null);
  const editItem = useMemo(() => (data ?? []).find((x) => x.id === editId) ?? null, [data, editId]);

  const resetCreate = () => {
    setClientName("");
    setClientTitle("");
    setContent("");
    setRating(5);
    setIsPublished(true);
  };

  const onCreate = async () => {
    if (!clientName.trim() || !content.trim()) {
      toast.error("الرجاء إدخال اسم العميل والمحتوى");
      return;
    }

    try {
      await create.mutateAsync({
        clientName,
        clientTitle: clientTitle.trim() ? clientTitle : null,
        content,
        rating,
        isPublished,
      });
      toast.success("تمت إضافة الرأي");
      setCreateOpen(false);
      resetCreate();
      await utils.cms.testimonialsList.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر إضافة الرأي");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة آراء العملاء</h1>
            <p className="text-muted-foreground">الآراء الظاهرة في الموقع العام.</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 rtl:mr-2 ml-2" />
                إضافة رأي
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة رأي عميل</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>اسم العميل</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>صفة العميل (اختياري)</Label>
                    <Input value={clientTitle} onChange={(e) => setClientTitle(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>المحتوى</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>التقييم (1-5)</Label>
                    <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value || 5))} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div>
                      <div className="font-medium">نشر</div>
                      <div className="text-xs text-muted-foreground">إظهار/إخفاء في الموقع العام</div>
                    </div>
                    <Switch checked={isPublished} onCheckedChange={setIsPublished} />
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
              <MessageSquareQuote className="h-5 w-5 text-gold" />
              الآراء
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">جاري التحميل...</div>
            ) : data && data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead>منشور</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium">{t.clientName}</div>
                        <div className="text-xs text-muted-foreground">{t.clientTitle ?? "—"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[520px] mt-2">{t.content}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-gold/15 text-gold border-gold/20">{t.rating}/5</Badge>
                      </TableCell>
                      <TableCell>{t.isPublished ? "نعم" : "لا"}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={editId === t.id} onOpenChange={(open) => setEditId(open ? t.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              تعديل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>تعديل رأي</DialogTitle>
                            </DialogHeader>
                            <EditTestimonialForm
                              item={editItem}
                              saving={update.isPending}
                              onSave={async (payload) => {
                                if (!editItem) return;
                                await update.mutateAsync({ id: editItem.id, ...payload });
                                toast.success("تم حفظ التعديلات");
                                setEditId(null);
                                await utils.cms.testimonialsList.invalidate();
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
              <div className="text-muted-foreground">لا توجد آراء بعد.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EditTestimonialForm({
  item,
  saving,
  onSave,
}: {
  item: any;
  saving: boolean;
  onSave: (data: {
    clientName?: string;
    clientTitle?: string | null;
    content?: string;
    rating?: number;
    isPublished?: boolean;
  }) => Promise<void>;
}) {
  const [clientName, setClientName] = useState("");
  const [clientTitle, setClientTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    setClientName(item?.clientName ?? "");
    setClientTitle(item?.clientTitle ?? "");
    setContent(item?.content ?? "");
    setRating(item?.rating ?? 5);
    setIsPublished(Boolean(item?.isPublished ?? true));
  }, [item?.id]);

  if (!item) {
    return <div className="text-muted-foreground">العنصر غير موجود</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>اسم العميل</Label>
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>صفة العميل (اختياري)</Label>
          <Input value={clientTitle} onChange={(e) => setClientTitle(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>المحتوى</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>التقييم (1-5)</Label>
          <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value || 5))} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
          <div>
            <div className="font-medium">نشر</div>
            <div className="text-xs text-muted-foreground">إظهار/إخفاء في الموقع العام</div>
          </div>
          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        </div>
      </div>

      <Button
        className="btn-gold"
        onClick={() =>
          onSave({
            clientName,
            clientTitle: clientTitle.trim() ? clientTitle : null,
            content,
            rating,
            isPublished,
          })
        }
        disabled={saving}
      >
        {saving ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </div>
  );
}
