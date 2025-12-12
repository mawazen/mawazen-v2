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
  FileText,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  File,
  FileImage,
  FileSpreadsheet,
  FolderOpen,
  Upload,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const documentTypeLabels: Record<string, string> = {
  contract: "عقد",
  memo: "مذكرة",
  pleading: "لائحة",
  evidence: "دليل",
  correspondence: "مراسلة",
  court_order: "حكم قضائي",
  power_of_attorney: "وكالة",
  other: "أخرى",
};

const documentTypeColors: Record<string, string> = {
  contract: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  memo: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pleading: "bg-green-500/20 text-green-400 border-green-500/30",
  evidence: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  correspondence: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  court_order: "bg-red-500/20 text-red-400 border-red-500/30",
  power_of_attorney: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.includes("image")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return FileSpreadsheet;
  return FileText;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "غير معروف";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Documents() {
  const [search, setSearch] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: documents, isLoading, refetch } = trpc.documents.list.useQuery({
    search: search || undefined,
  });

  const deleteDocument = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستند");
      refetch();
    },
    onError: () => {
      toast.error("حدث خطأ في حذف المستند");
    },
  });

  const documentsByType = documents?.reduce(
    (acc, doc) => {
      const type = doc.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, typeof documents>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-7 w-7 text-gold" />
              إدارة المستندات
            </h1>
            <p className="text-muted-foreground mt-1">
              تنظيم وأرشفة المستندات القانونية
            </p>
          </div>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Upload className="h-4 w-4 ml-2" />
                رفع مستند
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>رفع مستند جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-gold/50 transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-1">
                    اسحب الملفات هنا أو انقر للاختيار
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, JPG, PNG حتى 10MB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>نوع المستند</Label>
                  <Select defaultValue="other">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea placeholder="وصف المستند..." rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  className="btn-gold"
                  onClick={() => {
                    toast.info("ميزة رفع الملفات قيد التطوير");
                    setIsUploadOpen(false);
                  }}
                >
                  رفع المستند
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
                placeholder="بحث في المستندات..."
                className="pr-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Type Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(documentTypeLabels).map(([type, label]) => {
            const count = documentsByType?.[type]?.length ?? 0;
            return (
              <Card
                key={type}
                className="card-gold hover:border-gold/40 transition-all cursor-pointer"
              >
                <CardContent className="p-4 text-center">
                  <Badge
                    variant="outline"
                    className={`${documentTypeColors[type]} mb-2`}
                  >
                    {label}
                  </Badge>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Documents List */}
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
          ) : documents && documents.length > 0 ? (
            documents.map((doc) => {
              const FileIcon = getFileIcon(doc.mimeType);
              return (
                <Card
                  key={doc.id}
                  className="card-gold hover:border-gold/40 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                          <FileIcon className="h-6 w-6 text-gold" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {doc.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge
                              variant="outline"
                              className={documentTypeColors[doc.type]}
                            >
                              {documentTypeLabels[doc.type]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.fileSize)}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(doc.createdAt).toLocaleDateString("ar-SA")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = doc.fileUrl;
                            a.download = doc.name;
                            a.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا المستند؟")) {
                                  deleteDocument.mutate({ id: doc.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="card-gold">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  لا توجد مستندات
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  ابدأ برفع مستنداتك القانونية
                </p>
                <Button className="btn-gold" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="h-4 w-4 ml-2" />
                  رفع مستند
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
