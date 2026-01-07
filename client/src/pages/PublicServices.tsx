import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function PublicServices() {
  const { data: services, isLoading } = trpc.services.publicList.useQuery();
  const createRequest = trpc.serviceRequests.createPublic.useMutation();

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredAt, setPreferredAt] = useState("");

  const selectedService = services?.find((s) => s.id === selectedServiceId) ?? null;

  const resetForm = () => {
    setSelectedServiceId(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setNotes("");
    setPreferredAt("");
  };

  const submitRequest = async () => {
    if (!clientName.trim()) {
      toast.error("الرجاء إدخال الاسم");
      return;
    }

    try {
      await createRequest.mutateAsync({
        serviceId: selectedServiceId,
        clientName,
        clientEmail: clientEmail.trim() ? clientEmail : null,
        clientPhone: clientPhone.trim() ? clientPhone : null,
        notes: notes.trim() ? notes : null,
        preferredAt: preferredAt ? new Date(preferredAt) : null,
      });
      toast.success("تم إرسال طلبك بنجاح. سيتم التواصل معك قريباً.");
      resetForm();
    } catch (e: any) {
      toast.error(e?.message ?? "حدث خطأ أثناء إرسال الطلب");
    }
  };

  return (
    <div className="py-10">
      <div className="container">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold text-foreground">خدماتنا</h1>
          <p className="text-muted-foreground mt-2">اختر الخدمة المناسبة وقدم طلبك بسهولة.</p>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="text-muted-foreground">جاري تحميل الخدمات...</div>
          ) : services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="card-gold">
                  <CardHeader>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {service.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                    )}

                    <div className="text-sm">
                      <div className="text-muted-foreground">المدة: {service.durationMinutes} دقيقة</div>
                      <div className="text-muted-foreground">
                        السعر: {service.priceAmount} {service.currency}
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full btn-gold"
                          onClick={() => setSelectedServiceId(service.id)}
                        >
                          اطلب الخدمة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>طلب خدمة</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                            <div className="font-medium">{selectedService?.title ?? service.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {service.durationMinutes} دقيقة - {service.priceAmount} {service.currency}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>الاسم</Label>
                            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>البريد الإلكتروني (اختياري)</Label>
                              <Input
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                type="email"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>رقم الجوال (اختياري)</Label>
                              <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>ملاحظات (اختياري)</Label>
                            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
                          </div>

                          <div className="space-y-2">
                            <Label>وقت مفضل (اختياري)</Label>
                            <Input
                              value={preferredAt}
                              onChange={(e) => setPreferredAt(e.target.value)}
                              type="datetime-local"
                            />
                          </div>

                          <Button
                            className="btn-gold w-full"
                            onClick={submitRequest}
                            disabled={createRequest.isPending}
                          >
                            {createRequest.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">لا توجد خدمات متاحة حالياً.</div>
          )}
        </div>
      </div>
    </div>
  );
}
