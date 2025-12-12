import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Scale,
  Brain,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Gavel,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { useEffect } from "react";

const features = [
  {
    icon: Brain,
    title: "مساعد ذكي متخصص",
    description: "ذكاء اصطناعي متدرب على القانون السعودي لتحليل القضايا واكتشاف الثغرات",
  },
  {
    icon: FileText,
    title: "إدارة القضايا",
    description: "تتبع كامل لدورة حياة القضية من التسجيل حتى الإغلاق",
  },
  {
    icon: Users,
    title: "إدارة العملاء",
    description: "ملفات شاملة للعملاء مع سجل التواصل والمتابعة المالية",
  },
  {
    icon: Calendar,
    title: "تقويم ذكي",
    description: "جدولة الجلسات والمواعيد مع تنبيهات تلقائية",
  },
  {
    icon: BarChart3,
    title: "تحليلات متقدمة",
    description: "تقارير شاملة عن الأداء والإيرادات ونسب النجاح",
  },
  {
    icon: Shield,
    title: "أمان متقدم",
    description: "حماية كاملة للبيانات مع تشفير وصلاحيات متعددة",
  },
];

const capabilities = [
  "تحليل القضايا وتحديد نقاط القوة والضعف",
  "اكتشاف الثغرات القانونية في الدعاوى",
  "اقتراح استراتيجيات الدفاع المناسبة",
  "صياغة المذكرات القانونية",
  "البحث في السوابق القضائية",
  "تفسير الأنظمة واللوائح السعودية",
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-background to-background" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEMkFGMzciIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container relative py-20 lg:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="text-sm text-gold">مدعوم بالذكاء الاصطناعي</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                <span className="text-gold">قيد</span>
                <br />
                مساعدك القانوني الذكي
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                منصة متكاملة لإدارة المكاتب القانونية في المملكة العربية السعودية، مع مساعد ذكي متخصص في القانون السعودي لتحليل القضايا واكتشاف الثغرات القانونية.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  className="btn-gold text-lg px-8 py-6"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  ابدأ الآن مجاناً
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </Button>
                <Button
                  variant="outline"
                  className="text-lg px-8 py-6 border-gold/30 hover:border-gold/50 hover:bg-gold/5"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  اكتشف المزيد
                </Button>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="flex-1 relative">
              <div className="relative w-full max-w-lg mx-auto">
                {/* Main Card */}
                <div className="relative z-10 p-8 rounded-2xl bg-card border border-gold/20 shadow-2xl shadow-gold/5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gold/10 flex items-center justify-center">
                      <Scale className="h-8 w-8 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">قيد</h3>
                      <p className="text-sm text-muted-foreground">المساعد القانوني الذكي</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-gold" />
                        <span className="text-sm font-medium text-foreground">تحليل قضية</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        "حلل لي هذه القضية التجارية وحدد الثغرات القانونية المحتملة..."
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gold/5 border border-gold/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-gold" />
                        <span className="text-sm font-medium text-gold">رد المساعد</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        بناءً على نظام المحاكم التجارية، المادة 15، يمكن الطعن في...
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              كل ما تحتاجه في منصة واحدة
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              أدوات متكاملة لإدارة مكتبك القانوني بكفاءة واحترافية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-gold/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities Section */}
      <section className="py-20">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
                <Brain className="h-4 w-4 text-gold" />
                <span className="text-sm text-gold">ذكاء اصطناعي متخصص</span>
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                مساعد قانوني متدرب على
                <span className="text-gold"> القانون السعودي</span>
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8">
                مساعد ذكي متخصص في الأنظمة السعودية، يساعدك في تحليل القضايا، اكتشاف الثغرات، واقتراح استراتيجيات الدفاع المناسبة.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                    <span className="text-foreground">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="relative">
                <div className="p-8 rounded-2xl bg-card border border-gold/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Gavel className="h-5 w-5 text-gold" />
                    </div>
                    <span className="font-bold text-foreground">الأنظمة المدعومة</span>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      "نظام المرافعات الشرعية",
                      "نظام الإجراءات الجزائية",
                      "نظام المحاكم التجارية",
                      "نظام العمل والعمال",
                      "نظام الأحوال الشخصية",
                      "نظام التنفيذ",
                    ].map((system, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50"
                      >
                        <BookOpen className="h-4 w-4 text-gold" />
                        <span className="text-sm text-foreground">{system}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="absolute -z-10 -top-4 -right-4 w-full h-full rounded-2xl bg-gold/5 border border-gold/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-background to-gold/5">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              ابدأ في استخدام قيد اليوم
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              انضم إلى مئات المحامين الذين يستخدمون قيد لإدارة مكاتبهم بكفاءة أعلى
            </p>
            <Button
              className="btn-gold text-lg px-10 py-6"
              onClick={() => window.location.href = getLoginUrl()}
            >
              ابدأ الآن مجاناً
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-gold" />
              <span className="font-bold text-foreground">قيد</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} قيد - جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
