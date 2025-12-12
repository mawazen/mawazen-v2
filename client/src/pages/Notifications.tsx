import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  MessageCircle,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

export default function Notifications() {
  const [notificationSettings, setNotificationSettings] = useState({
    hearingReminders: true,
    deadlineAlerts: true,
    paymentNotices: true,
    caseUpdates: true,
    documentUploads: true,
    teamMessages: true,
  });

  const [notificationChannels, setNotificationChannels] = useState({
    email: true,
    sms: true,
    whatsapp: false,
    inApp: true,
  });

  const [contactInfo, setContactInfo] = useState({
    email: "lawyer@example.com",
    phone: "+966501234567",
  });

  const handleSettingChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("تم تحديث الإعدادات");
  };

  const handleChannelChange = (key: keyof typeof notificationChannels) => {
    setNotificationChannels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("تم تحديث قنوات الإشعارات");
  };

  const recentNotifications = [
    {
      id: 1,
      title: "تذكير بجلسة قادمة",
      message: "جلسة قضية رقم 2024/001 غداً الساعة 10:00 صباحاً",
      type: "hearing",
      time: "منذ ساعة",
      read: false,
    },
    {
      id: 2,
      title: "موعد نهائي قريب",
      message: "آخر موعد لتقديم الرد على الدعوى: 2024-12-20",
      type: "deadline",
      time: "منذ 3 ساعات",
      read: false,
    },
    {
      id: 3,
      title: "فاتورة جديدة",
      message: "تم إنشاء فاتورة جديدة برقم #INV-2024-001",
      type: "payment",
      time: "منذ يوم",
      read: true,
    },
    {
      id: 4,
      title: "تحديث القضية",
      message: "تم تحديث حالة قضية رقم 2024/002 إلى 'قيد الاستئناف'",
      type: "case",
      time: "منذ يومين",
      read: true,
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "hearing":
        return <Clock className="h-5 w-5 text-blue-400" />;
      case "deadline":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "payment":
        return <Bell className="h-5 w-5 text-yellow-400" />;
      case "case":
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      default:
        return <Bell className="h-5 w-5 text-gold" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8 text-gold" />
            الإشعارات والتنبيهات
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة إعدادات الإشعارات والتنبيهات
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notification Types */}
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gold" />
                  أنواع الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">تذكيرات الجلسات</p>
                    <p className="text-sm text-muted-foreground">
                      تنبيهات قبل الجلسات المجدولة
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.hearingReminders}
                    onCheckedChange={() =>
                      handleSettingChange("hearingReminders" as keyof typeof notificationSettings)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">تنبيهات المواعيد النهائية</p>
                    <p className="text-sm text-muted-foreground">
                      تذكيرات بالمواعيد النهائية للإجراءات
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.deadlineAlerts}
                    onCheckedChange={() =>
                      handleSettingChange("deadlineAlerts" as keyof typeof notificationSettings)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">إشعارات الدفع</p>
                    <p className="text-sm text-muted-foreground">
                      تنبيهات حول الفواتير والمدفوعات
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.paymentNotices}
                    onCheckedChange={() =>
                      handleSettingChange("paymentNotices" as keyof typeof notificationSettings)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">تحديثات القضايا</p>
                    <p className="text-sm text-muted-foreground">
                      تنبيهات بتحديثات حالة القضايا
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.caseUpdates}
                    onCheckedChange={() =>
                      handleSettingChange("caseUpdates" as keyof typeof notificationSettings)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">تحميلات المستندات</p>
                    <p className="text-sm text-muted-foreground">
                      تنبيهات عند تحميل مستندات جديدة
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.documentUploads}
                    onCheckedChange={() =>
                      handleSettingChange("documentUploads" as keyof typeof notificationSettings)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">رسائل الفريق</p>
                    <p className="text-sm text-muted-foreground">
                      تنبيهات برسائل الفريق والتعليقات
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.teamMessages}
                    onCheckedChange={() =>
                      handleSettingChange("teamMessages" as keyof typeof notificationSettings)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Channels */}
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-gold" />
                  قنوات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-foreground">البريد الإلكتروني</p>
                      <p className="text-sm text-muted-foreground">
                        إرسال الإشعارات عبر البريد الإلكتروني
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationChannels.email}
                    onCheckedChange={() => handleChannelChange("email" as keyof typeof notificationChannels)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="font-medium text-foreground">رسائل نصية (SMS)</p>
                      <p className="text-sm text-muted-foreground">
                        إرسال الإشعارات عبر الرسائل النصية
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationChannels.sms}
                    onCheckedChange={() => handleChannelChange("sms" as keyof typeof notificationChannels)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-foreground">واتساب</p>
                      <p className="text-sm text-muted-foreground">
                        إرسال الإشعارات عبر واتساب
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationChannels.whatsapp}
                    onCheckedChange={() => handleChannelChange("whatsapp" as keyof typeof notificationChannels)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gold" />
                    <div>
                      <p className="font-medium text-foreground">الإشعارات داخل التطبيق</p>
                      <p className="text-sm text-muted-foreground">
                        إشعارات مباشرة داخل التطبيق
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationChannels.inApp}
                    onCheckedChange={() => handleChannelChange("inApp" as keyof typeof notificationChannels)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-gold" />
                  معلومات الاتصال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground mb-2 block">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="bg-secondary/50 border-border/50"
                  />
                </div>

                <div>
                  <Label className="text-foreground mb-2 block">
                    رقم الهاتف
                  </Label>
                  <Input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="bg-secondary/50 border-border/50"
                  />
                </div>

                <Button
                  className="w-full bg-gold hover:bg-gold-light text-black font-semibold"
                  onClick={() => toast.success("تم حفظ معلومات الاتصال")}
                >
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Notifications */}
          <div>
            <Card className="card-gold">
              <CardHeader>
                <CardTitle className="text-lg">الإشعارات الأخيرة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-all ${
                      notification.read
                        ? "bg-secondary/30 border-border/30"
                        : "bg-secondary/50 border-gold/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full border-gold/30 hover:border-gold/50 mt-4"
                >
                  عرض جميع الإشعارات
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
