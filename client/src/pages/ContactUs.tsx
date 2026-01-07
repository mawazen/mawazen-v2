import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactUs() {
  const create = trpc.contact.createPublic.useMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!name.trim() || !message.trim()) {
      toast.error("الرجاء إدخال الاسم والرسالة");
      return;
    }

    try {
      await create.mutateAsync({
        name,
        email: email.trim() ? email : null,
        phone: phone.trim() ? phone : null,
        message,
      });
      toast.success("تم إرسال رسالتك بنجاح");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (e: any) {
      toast.error(e?.message ?? "حدث خطأ أثناء الإرسال");
    }
  };

  return (
    <div className="py-10">
      <div className="container">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold text-foreground">اتصل بنا</h1>
          <p className="text-muted-foreground mt-2">نستقبل استفساراتكم وطلباتكم.</p>
        </div>

        <div className="mt-8">
          <Card className="card-gold max-w-2xl">
          <CardHeader>
            <CardTitle>نموذج التواصل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>البريد الإلكتروني (اختياري)</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <div className="space-y-2">
                <Label>رقم الجوال (اختياري)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الرسالة</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} />
            </div>

            <Button className="btn-gold" onClick={submit} disabled={create.isPending}>
              {create.isPending ? "جاري الإرسال..." : "إرسال"}
            </Button>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
