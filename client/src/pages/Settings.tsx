import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  Globe,
  Building2,
  Mail,
  Phone,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { theme, setTheme, palette, setPalette, palettes, switchable } = useTheme();

  const handleSave = () => {
    toast.success("تم حفظ الإعدادات بنجاح");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-7 w-7 text-gold" />
            الإعدادات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة إعدادات النظام والتفضيلات
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Office Information */}
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gold" />
                  معلومات المكتب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المكتب</Label>
                    <Input placeholder="مكتب المحاماة" defaultValue="مكتب موازين للمحاماة" />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الترخيص</Label>
                    <Input placeholder="رقم الترخيص" dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input type="email" placeholder="email@example.com" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input type="tel" placeholder="+966" dir="ltr" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input placeholder="العنوان التفصيلي" />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gold" />
                  إعدادات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">تذكيرات الجلسات</p>
                    <p className="text-sm text-muted-foreground">
                      إرسال تذكير قبل موعد الجلسة
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">تنبيهات المواعيد النهائية</p>
                    <p className="text-sm text-muted-foreground">
                      إشعار عند اقتراب موعد نهائي
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">إشعارات الفواتير</p>
                    <p className="text-sm text-muted-foreground">
                      تنبيه عند استحقاق الفواتير
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">إشعارات البريد الإلكتروني</p>
                    <p className="text-sm text-muted-foreground">
                      إرسال الإشعارات عبر البريد
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">إشعارات SMS</p>
                    <p className="text-sm text-muted-foreground">
                      إرسال رسائل نصية للتذكيرات المهمة
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gold" />
                  الأمان والخصوصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">المصادقة الثنائية</p>
                    <p className="text-sm text-muted-foreground">
                      تفعيل طبقة حماية إضافية
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">تسجيل الخروج التلقائي</p>
                    <p className="text-sm text-muted-foreground">
                      تسجيل الخروج بعد فترة عدم نشاط
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">سجل النشاط</p>
                    <p className="text-sm text-muted-foreground">
                      تتبع جميع الأنشطة في النظام
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            {/* Appearance */}
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5 text-gold" />
                  المظهر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">الوضع الداكن</span>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={checked => {
                      setTheme?.(checked ? "dark" : "light");
                    }}
                    disabled={!switchable || !setTheme}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ثيم الألوان</Label>
                  <Select
                    value={palette}
                    onValueChange={value => {
                      setPalette?.(value as typeof palette);
                    }}
                    disabled={!switchable || !setPalette}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الثيم" />
                    </SelectTrigger>
                    <SelectContent>
                      {palettes.map(p => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">تأثيرات الحركة</span>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Language */}
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-gold" />
                  اللغة والمنطقة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>اللغة</Label>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    العربية
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>المنطقة الزمنية</Label>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    توقيت الرياض (GMT+3)
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:border-gold/50"
                  onClick={() => toast.info("ميزة تصدير البيانات قيد التطوير")}
                >
                  تصدير البيانات
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:border-gold/50"
                  onClick={() => toast.info("ميزة استيراد البيانات قيد التطوير")}
                >
                  استيراد البيانات
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:border-gold/50"
                  onClick={() => toast.info("ميزة النسخ الاحتياطي قيد التطوير")}
                >
                  نسخ احتياطي
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="btn-gold" onClick={handleSave}>
            <Save className="h-4 w-4 rtl:mr-2 ml-2" />
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
