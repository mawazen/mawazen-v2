import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";
import { useLocation, useRoute } from "wouter";

export default function BlogPost() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/blog/:slug");

  const slug = useMemo(() => params?.slug ?? null, [params?.slug]);

  const { data, isLoading } = trpc.blog.publicGetBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: Boolean(match) && Boolean(slug) }
  );

  if (!match || !slug) {
    return (
      <div className="container py-16">
        <div className="text-muted-foreground">الرابط غير صالح</div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="container">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">{data?.title ?? "مقال"}</h1>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={() => setLocation("/blog")}>
              رجوع للمدونة
            </Button>
          </div>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="text-muted-foreground">جاري التحميل...</div>
          ) : data ? (
            <Card className="card-gold">
              <CardHeader>
                <CardTitle>{data.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.content ? (
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                    {data.content}
                  </div>
                ) : (
                  <div className="text-muted-foreground">لا يوجد محتوى بعد.</div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-muted-foreground">المقال غير متاح.</div>
          )}
        </div>
      </div>
    </div>
  );
}
