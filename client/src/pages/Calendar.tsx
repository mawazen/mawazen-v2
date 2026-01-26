import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronRight,
  ChevronLeft,
  Clock,
  MapPin,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const hearingTypeLabels: Record<string, string> = {
  initial: "جلسة أولى",
  follow_up: "جلسة متابعة",
  evidence: "جلسة أدلة",
  pleading: "جلسة مرافعة",
  judgment: "جلسة حكم",
  appeal: "جلسة استئناف",
  other: "أخرى",
};

const hearingTypeColors: Record<string, string> = {
  initial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  follow_up: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  evidence: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  pleading: "bg-green-500/20 text-green-400 border-green-500/30",
  judgment: "bg-red-500/20 text-red-400 border-red-500/30",
  appeal: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: hearings, isLoading, refetch } = trpc.hearings.list.useQuery({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  const { data: cases } = trpc.cases.list.useQuery();

  const createHearing = trpc.hearings.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الجلسة بنجاح");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: () => {
      toast.error("حدث خطأ في إضافة الجلسة");
    },
  });

  const [formData, setFormData] = useState({
    caseId: 0,
    title: "",
    hearingDate: "",
    hearingTime: "",
    type: "follow_up" as keyof typeof hearingTypeLabels,
    location: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      caseId: 0,
      title: "",
      hearingDate: "",
      hearingTime: "",
      type: "follow_up",
      location: "",
      notes: "",
    });
  };

  const handleCreate = () => {
    if (!formData.caseId || !formData.title || !formData.hearingDate || !formData.hearingTime) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    const dateTime = new Date(`${formData.hearingDate}T${formData.hearingTime}`);
    createHearing.mutate({
      caseId: formData.caseId,
      title: formData.title,
      hearingDate: dateTime,
      location: formData.location || null,
      notes: formData.notes || null,
    });
  };

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDayOfWeek = startOfMonth.getDay();
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    
    return days;
  }, [currentDate, startOfMonth, endOfMonth]);

  // Group hearings by date
  const hearingsByDate = useMemo(() => {
    if (!hearings) return {};
    return hearings.reduce((acc: Record<string, typeof hearings>, hearing: typeof hearings[0]) => {
      const dateKey = new Date(hearing.hearingDate).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(hearing);
      return acc;
    }, {} as Record<string, typeof hearings>);
  }, [hearings]);

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const today = new Date();
  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const selectedDateHearings = selectedDate
    ? hearingsByDate[selectedDate.toDateString()] || []
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-7 w-7 text-gold" />
              التقويم والجلسات
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة مواعيد الجلسات والأحداث
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gold">
                <Plus className="h-4 w-4 ml-2" />
                جلسة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>إضافة جلسة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>القضية *</Label>
                  <Select
                    value={formData.caseId.toString()}
                    onValueChange={(v) =>
                      setFormData({ ...formData, caseId: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القضية" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.caseNumber} - {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>عنوان الجلسة *</Label>
                  <Input
                    placeholder="مثال: جلسة مرافعة"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>التاريخ *</Label>
                    <Input
                      type="date"
                      dir="ltr"
                      value={formData.hearingDate}
                      onChange={(e) =>
                        setFormData({ ...formData, hearingDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوقت *</Label>
                    <Input
                      type="time"
                      dir="ltr"
                      value={formData.hearingTime}
                      onChange={(e) =>
                        setFormData({ ...formData, hearingTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الجلسة</Label>
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
                        {Object.entries(hearingTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>المكان</Label>
                    <Input
                      placeholder="المحكمة / القاعة"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    placeholder="ملاحظات إضافية..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
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
                  disabled={createHearing.isPending}
                >
                  {createHearing.isPending ? "جاري الإضافة..." : "إضافة الجلسة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="card-gold lg:col-span-2">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(-1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <CardTitle className="text-lg">
                  {MONTHS_AR[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                اليوم
              </Button>
            </CardHeader>
            <CardContent>
              {/* Days header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_AR.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const dateHearings = date
                    ? hearingsByDate[date.toDateString()] || []
                    : [];
                  const isSelected =
                    date && selectedDate?.toDateString() === date.toDateString();

                  return (
                    <button
                      key={index}
                      onClick={() => date && setSelectedDate(date)}
                      disabled={!date}
                      className={`
                        aspect-square p-1 rounded-lg text-sm relative transition-all
                        ${!date ? "invisible" : ""}
                        ${isToday(date) ? "bg-gold/20 text-gold font-bold" : ""}
                        ${isSelected ? "ring-2 ring-gold" : ""}
                        ${date && !isToday(date) ? "hover:bg-secondary" : ""}
                      `}
                    >
                      {date && (
                        <>
                          <span>{date.getDate()}</span>
                          {dateHearings.length > 0 && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {dateHearings.slice(0, 3).map((_: unknown, i: number) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full bg-gold"
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Hearings */}
          <Card className="card-gold">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedDate
                  ? `${DAYS_AR[selectedDate.getDay()]} ${selectedDate.getDate()} ${MONTHS_AR[selectedDate.getMonth()]}`
                  : "اختر يوماً"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>اختر يوماً لعرض الجلسات</p>
                </div>
              ) : selectedDateHearings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد جلسات في هذا اليوم</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateHearings.map((hearing: { id: number; title: string; hearingDate: Date; status: string; location: string | null }) => (
                    <div
                      key={hearing.id}
                      className="p-3 rounded-lg bg-secondary/50 border border-border/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">
                          {hearing.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={hearingTypeColors[hearing.status] || hearingTypeColors.other}
                        >
                          {hearingTypeLabels[hearing.status] || hearing.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(hearing.hearingDate).toLocaleTimeString(
                            "ar-SA",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                        {hearing.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {hearing.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Hearings List */}
        <Card className="card-gold">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gold" />
              الجلسات القادمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : hearings && hearings.filter((h: typeof hearings[0]) => new Date(h.hearingDate) >= today).length > 0 ? (
              <div className="space-y-3">
                {hearings
                  .filter((h: typeof hearings[0]) => new Date(h.hearingDate) >= today)
                  .sort((a: typeof hearings[0], b: typeof hearings[0]) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())
                  .slice(0, 5)
                  .map((hearing: typeof hearings[0]) => (
                    <div
                      key={hearing.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg bg-secondary/50 border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                          <CalendarIcon className="h-6 w-6 text-gold" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {hearing.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <Badge
                              variant="outline"
                              className={hearingTypeColors[hearing.status] || hearingTypeColors.other}
                            >
                              {hearingTypeLabels[hearing.status] || hearing.status}
                            </Badge>
                            {hearing.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {hearing.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right sm:text-left">
                        <p className="font-medium text-gold">
                          {new Date(hearing.hearingDate).toLocaleDateString("ar-SA")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(hearing.hearingDate).toLocaleTimeString("ar-SA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد جلسات قادمة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
