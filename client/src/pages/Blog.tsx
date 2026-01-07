import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Blog() {
  const { data, isLoading } = trpc.blog.publicList.useQuery();
  const [, setLocation] = useLocation();

  return (
    <div className="py-10">
      <div className="container">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold text-foreground">المدونة</h1>
          <p className="text-muted-foreground mt-2">مقالات وأخبار ونصائح قانونية.</p>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="text-muted-foreground">جاري التحميل...</div>
          ) : data && data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((p) => (
                <Card key={p.id} className="card-gold">
                  <CardHeader>
                    <CardTitle className="text-lg">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {p.excerpt ? (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">
                        {p.excerpt}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}

                    <Button className="btn-gold w-full" onClick={() => setLocation(`/blog/${p.slug}`)}>
                      اقرأ المزيد
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">لا توجد مقالات منشورة حالياً.</div>
          )}
        </div>
      </div>
    </div>
  );
}
