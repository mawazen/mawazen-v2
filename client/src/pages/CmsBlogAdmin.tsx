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

export default function CmsBlogAdmin() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.blog.adminList.useQuery();
  const upsert = trpc.blog.adminUpsert.useMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [editSlug, setEditSlug] = useState<string | null>(null);
  const editItem = useMemo(() => (data ?? []).find((p) => p.slug === editSlug) ?? null, [data, editSlug]);

  const resetCreate = () => {
    setSlug("");
    setTitle("");
    setExcerpt("");
    setContent("");
    setIsPublished(true);
  };

  const onCreate = async () => {
    if (!slug.trim() || !title.trim()) {
      toast.error("الرجاء إدخال slug والعنوان");
      return;
    }

    try {
      await upsert.mutateAsync({
        slug: slug.trim(),
        title: title.trim(),
        excerpt: excerpt.trim() ? excerpt : null,
        content: content.trim() ? content : null,
        isPublished,
      });
      toast.success("تم حفظ المقال");
      setCreateOpen(false);
      resetCreate();
      await utils.blog.adminList.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر حفظ المقال");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة المدونة</h1>
            <p className="text-muted-foreground">إنشاء وتعديل المقالات.</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 rtl:mr-2 ml-2" />
                مقال جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>إنشاء مقال</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-first-post" />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ملخص (اختياري)</Label>
                  <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>المحتوى</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <div className="font-medium">نشر المقال</div>
                    <div className="text-xs text-muted-foreground">إظهار المقال في صفحة المدونة العامة</div>
                  </div>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>

                <div className="flex gap-2">
                  <Button className="btn-gold flex-1" onClick={onCreate} disabled={upsert.isPending}>
                    {upsert.isPending ? "جاري الحفظ..." : "حفظ"}
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
              المقالات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">جاري التحميل...</div>
            ) : data && data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>منشور</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                      <TableCell>
                        <div className="font-medium">{p.title}</div>
                        {p.excerpt && (
                          <div className="text-xs text-muted-foreground truncate max-w-[520px]">{p.excerpt}</div>
                        )}
                      </TableCell>
                      <TableCell>{p.isPublished ? "نعم" : "لا"}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={editSlug === p.slug} onOpenChange={(open) => setEditSlug(open ? p.slug : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              تعديل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>تعديل مقال</DialogTitle>
                            </DialogHeader>
                            <EditBlogForm
                              item={editItem}
                              saving={upsert.isPending}
                              onSave={async (payload) => {
                                if (!editItem) return;
                                await upsert.mutateAsync({ slug: editItem.slug, ...payload });
                                toast.success("تم حفظ المقال");
                                setEditSlug(null);
                                await utils.blog.adminList.invalidate();
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
              <div className="text-muted-foreground">لا توجد مقالات بعد.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EditBlogForm({
  item,
  saving,
  onSave,
}: {
  item: any;
  saving: boolean;
  onSave: (data: { title: string; excerpt: string | null; content: string | null; isPublished: boolean }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    setTitle(item?.title ?? "");
    setExcerpt(item?.excerpt ?? "");
    setContent(item?.content ?? "");
    setIsPublished(Boolean(item?.isPublished ?? true));
  }, [item?.id]);

  if (!item) return <div className="text-muted-foreground">العنصر غير موجود</div>;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Slug</Label>
        <Input value={item.slug} readOnly />
      </div>
      <div className="space-y-2">
        <Label>العنوان</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>ملخص (اختياري)</Label>
        <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>المحتوى</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
        <div>
          <div className="font-medium">نشر المقال</div>
          <div className="text-xs text-muted-foreground">إظهار المقال في صفحة المدونة العامة</div>
        </div>
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
      </div>
      <Button
        className="btn-gold"
        onClick={() => onSave({ title: title.trim() || item.title, excerpt: excerpt.trim() ? excerpt : null, content: content.trim() ? content : null, isPublished })}
        disabled={saving}
      >
        {saving ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </div>
  );
}
