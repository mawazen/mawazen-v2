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
import { FileText, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function CmsPagesAdmin() {
  const utils = trpc.useUtils();
  const { data: pages, isLoading } = trpc.cms.pagesList.useQuery();
  const upsert = trpc.cms.pageUpsert.useMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [editSlug, setEditSlug] = useState<string | null>(null);
  const editPage = useMemo(() => pages?.find((p) => p.slug === editSlug) ?? null, [pages, editSlug]);

  const resetCreate = () => {
    setSlug("");
    setTitle("");
    setContent("");
    setIsPublished(true);
  };

  const createPage = async () => {
    if (!slug.trim() || !title.trim()) {
      toast.error("الرجاء إدخال slug والعنوان");
      return;
    }

    try {
      await upsert.mutateAsync({
        slug: slug.trim(),
        title: title.trim(),
        content: content.trim() ? content : null,
        isPublished,
      });
      toast.success("تم حفظ الصفحة");
      setCreateOpen(false);
      resetCreate();
      await utils.cms.pagesList.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر حفظ الصفحة");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة صفحات الموقع</h1>
            <p className="text-muted-foreground">إنشاء وتعديل صفحات المحتوى العامة (About/Pricing...).</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 ml-2" />
                صفحة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء/تعديل صفحة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about" />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>المحتوى</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <div className="font-medium">نشر الصفحة</div>
                    <div className="text-xs text-muted-foreground">إظهار الصفحة في الموقع العام</div>
                  </div>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>

                <div className="flex gap-2">
                  <Button className="btn-gold flex-1" onClick={createPage} disabled={upsert.isPending}>
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
              <FileText className="h-5 w-5 text-gold" />
              الصفحات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">جاري التحميل...</div>
            ) : pages && pages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>منشورة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                      <TableCell>{p.title}</TableCell>
                      <TableCell>{p.isPublished ? "نعم" : "لا"}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={editSlug === p.slug} onOpenChange={(open) => setEditSlug(open ? p.slug : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              تعديل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>تعديل صفحة</DialogTitle>
                            </DialogHeader>
                            <EditPageForm
                              page={editPage}
                              saving={upsert.isPending}
                              onSave={async (data) => {
                                if (!editPage) return;
                                await upsert.mutateAsync({
                                  slug: editPage.slug,
                                  title: data.title,
                                  content: data.content,
                                  isPublished: data.isPublished,
                                });
                                toast.success("تم حفظ الصفحة");
                                setEditSlug(null);
                                await utils.cms.pagesList.invalidate();
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
              <div className="text-muted-foreground">لا توجد صفحات بعد.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EditPageForm({
  page,
  saving,
  onSave,
}: {
  page: any;
  saving: boolean;
  onSave: (data: { title: string; content: string | null; isPublished: boolean }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    setTitle(page?.title ?? "");
    setContent(page?.content ?? "");
    setIsPublished(Boolean(page?.isPublished ?? true));
  }, [page?.id]);

  if (!page) {
    return <div className="text-muted-foreground">الصفحة غير موجودة</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Slug</Label>
        <Input value={page.slug} readOnly />
      </div>
      <div className="space-y-2">
        <Label>العنوان</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>المحتوى</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
        <div>
          <div className="font-medium">نشر الصفحة</div>
          <div className="text-xs text-muted-foreground">إظهار الصفحة في الموقع العام</div>
        </div>
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
      </div>
      <Button
        className="btn-gold"
        onClick={() => onSave({ title: title.trim() || page.title, content: content.trim() ? content : null, isPublished })}
        disabled={saving}
      >
        {saving ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </div>
  );
}
