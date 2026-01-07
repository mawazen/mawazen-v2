import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function SitePage({
  slug,
  fallbackTitle,
}: {
  slug: string;
  fallbackTitle: string;
}) {
  const { data, isLoading } = trpc.publicSite.page.useQuery({ slug });

  return (
    <div className="py-10">
      <div className="container">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold text-foreground">{data?.title ?? fallbackTitle}</h1>
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
            <div className="text-muted-foreground">الصفحة غير متاحة حالياً.</div>
          )}
        </div>
      </div>
    </div>
  );
}
