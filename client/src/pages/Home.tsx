import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocation } from "wouter";
import { cubicBezier, motion, useReducedMotion } from "framer-motion";
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
  Zap,
  Clock,
  Bell,
  Link,
  Search,
  Lock,
  BadgeCheck,
  Star,
  Quote,
} from "lucide-react";

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
  {
    icon: Bell,
    title: "تنبيهات ومتابعات",
    description: "تنبيهات للجلسات والمواعيد والمتأخرات، مع متابعة واضحة لما يجب إنجازه",
  },
  {
    icon: Link,
    title: "بوابة عميل عامة",
    description: "رابط آمن يتيح للعميل متابعة قضاياه والفواتير والدفعات والمستندات المشتركة",
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

const supportedSystems = [
  "هيئة السوق المالية",
  "البنك المركزي السعودي",
  "هيئة الزكاة والضريبة والجمارك",
  "هيئة كفاءة الإنفاق",
  "هيئة الرقابة ومكافحة الفساد",
  "بوابة مُعين",
  "منصة ناجز",
  "النظام الأساسي للحكم",
  "نظام مجلس الوزراء",
  "نظام مجلس الشورى",
  "نظام المناطق",
  "نظام البيعة",
  "نظام القضاء",
  "نظام ديوان المظالم",
  "نظام المرافعات الشرعية",
  "نظام الإجراءات الجزائية",
  "نظام التنفيذ",
  "نظام المحاماة",
  "نظام التوثيق",
  "نظام العمل السعودي",
  "لائحة نظام العمل",
  "نظام التأمينات الاجتماعية",
  "نظام مكافحة التستر",
  "نظام الموارد البشرية في الخدمة المدنية",
  "نظام الخدمة العسكرية",
  "نظام التدريب التقني والمهني",
  "نظام الشركات",
  "نظام الإفلاس",
  "نظام التجارة الإلكترونية",
  "نظام السجل التجاري",
  "نظام العلامات التجارية",
  "نظام الأسماء التجارية",
  "نظام المنافسة",
  "نظام الامتياز التجاري",
  "نظام الغرف التجارية",
  "نظام الوكالات التجارية",
  "نظام الزكاة",
  "نظام ضريبة القيمة المضافة",
  "نظام ضريبة الدخل",
  "نظام الجمارك الموحد",
  "نظام الإيرادات العامة",
  "نظام الدين العام",
  "نظام المنافسات والمشتريات الحكومية",
  "نظام مكافحة الرشوة",
  "نظام مكافحة غسل الأموال",
  "نظام مكافحة الإرهاب وتمويله",
  "نظام الجرائم المعلوماتية",
  "نظام مكافحة التزوير",
  "نظام مكافحة المخدرات",
  "نظام الأسلحة",
  "نظام حماية الأموال العامة",
  "نظام تأديب الموظفين",
  "نظام حماية المبلغين",
  "نظام نزاهة",
  "نظام حوكمة الجهات الحكومية",
  "نظام الأحوال الشخصية",
  "نظام المعاملات المدنية",
  "نظام الإثبات",
  "نظام التركات",
  "نظام الوصايا",
  "نظام الأوقاف",
  "نظام حماية البيانات الشخصية",
  "نظام التعاملات الإلكترونية",
  "نظام الأمن السيبراني",
  "نظام الحكومة الرقمية",
  "نظام التسجيل العيني للعقار",
  "نظام نزع الملكية",
  "نظام الوساطة العقارية",
  "نظام المساهمات العقارية",
  "نظام البلديات",
  "نظام التخطيط العمراني",
  "اللوائح التنفيذية",
  "التعاميم الوزارية",
  "الأدلة الإجرائية",
  "القرارات التفسيرية",
];

const outcomes = [
  { icon: Clock, label: "توفير الوقت", value: "ساعات يوميًا" },
  { icon: Zap, label: "سرعة الإنجاز", value: "تنفيذ أسرع" },
  { icon: Shield, label: "موثوقية", value: "تنظيم + أمان" },
  { icon: BarChart3, label: "رؤية واضحة", value: "تقارير فورية" },
];

const steps = [
  {
    title: "أنشئ ملف العميل والقضية",
    description: "نظّم كل بيانات العميل، المستندات، والأحداث في مكان واحد.",
  },
  {
    title: "تابع الجلسات والمهام والتنبيهات",
    description: "تقويم ذكي + مهام مرتبطة بالقضية مع تذكيرات تمنع أي سهو.",
  },
  {
    title: "شارك ما يلزم عبر بوابة العميل",
    description: "ارسل رابطًا آمنًا للعميل لمتابعة التقدّم والمستندات والفواتير.",
  },
  {
    title: "استخدم المساعد الذكي",
    description: "تحليل، صياغة، وبحث نظامي/قضائي — مع مصادر واضحة.",
  },
];

const faqs = [
  {
    q: "هل موازين مناسب للمحامي الفردي أم للمكتب؟",
    a: "مناسب للطرفين. يمكنك البدء كمحامٍ فردي ثم التوسع بسهولة، مع تنظيم القضايا والعملاء والمهام والتقارير.",
  },
  {
    q: "كيف تعمل بوابة العميل؟",
    a: "تولّد رابطًا آمنًا لكل عميل، يظهر له القضايا والجلسات والفواتير والدفعات والمستندات المشتركة فقط.",
  },
  {
    q: "هل البيانات آمنة؟",
    a: "نركّز على الأمان: صلاحيات، ممارسات تشفير، وتقليل مشاركة البيانات. ويمكنك التحكم بما يتم مشاركته للعميل.",
  },
  {
    q: "هل الذكاء الاصطناعي يكتب بدل المحامي؟",
    a: "هو مساعد يزيد الإنتاجية: يقترح، ينظّم، ويولّد مسودات قابلة للمراجعة. القرار النهائي دائمًا بيد المحامي.",
  },
];

const testimonials = [
  {
    quote: "أخيرًا صار عندنا مكان واحد لكل شيء: قضايا، مستندات، فواتير، وتنبيهات. وفر علينا وقت كبير في المتابعة.",
    name: "محامٍ",
    org: "مكتب محاماة",
  },
  {
    quote: "بوابة العميل رفعت مستوى الخدمة. العميل يشوف التحديثات والمستندات المشتركة بدون رسائل متفرقة.",
    name: "مدير مكتب",
    org: "شركة قانونية",
  },
  {
    quote: "المساعد الذكي ممتاز كبداية للمسودات وتلخيص المعطيات. نراجع ونعدل، لكنه يسرّع الشغل.",
    name: "مستشار قانوني",
    org: "ممارسة خاصة",
  },
];

const pricingTeaser = [
  {
    title: "فردي",
    description: "للمحامي الفردي الذي يريد تنظيم القضايا والعملاء والمهام بسهولة.",
    bullets: ["إدارة القضايا والعملاء", "مستندات وفواتير", "تقويم وتنبيهات"],
  },
  {
    title: "مكتب",
    description: "للمكاتب التي تحتاج صلاحيات وتنظيم أعلى وإدارة فريق.",
    bullets: ["فرق وصلاحيات", "تقارير وتحليلات", "بوابة عميل"],
  },
  {
    title: "مؤسسي",
    description: "للجهات الكبيرة التي تحتاج تخصيص أعلى وتوسع.",
    bullets: ["توسّع ومرونة", "حوكمة وصلاحيات", "دعم وإعداد"],
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const reducedMotion = useReducedMotion();
  const easePremium = cubicBezier(0.22, 1, 0.36, 1);

  const fadeUpInitial = { opacity: 0, y: reducedMotion ? 0 : 18 };
  const fadeUpAnimate = { opacity: 1, y: 0 };
  const fadeUpTransition = {
    duration: reducedMotion ? 0 : 0.7,
    ease: easePremium,
  };

  const fadeInInitial = { opacity: 0 };
  const fadeInAnimate = { opacity: 1 };
  const fadeInTransition = {
    duration: reducedMotion ? 0 : 0.7,
    ease: easePremium,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <motion.div
          className="absolute inset-0 bg-gold/3"
          initial={fadeInInitial}
          animate={fadeInAnimate}
          transition={fadeInTransition}
        />
        <motion.div
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNEMkFGMzciIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"
          initial={fadeInInitial}
          animate={fadeInAnimate}
          transition={fadeInTransition}
        />
        
        <div className="container relative pt-6 pb-20 lg:pt-10 lg:pb-28">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-right">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6"
                initial={fadeUpInitial}
                animate={fadeUpAnimate}
                transition={fadeUpTransition}
              >
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="text-sm text-gold">مدعوم بالذكاء الاصطناعي</span>
              </motion.div>
              
              <motion.h1
                className="text-4xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight"
                initial={fadeUpInitial}
                animate={fadeUpAnimate}
                transition={{
                  duration: reducedMotion ? 0 : 0.8,
                  delay: reducedMotion ? 0 : 0.06,
                  ease: easePremium,
                }}
              >
                <span className="text-gold-gradient">موازين</span>
                <br />
                منصة إدارة المكتب القانوني
              </motion.h1>
              
              <motion.p
                className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                initial={fadeUpInitial}
                animate={fadeUpAnimate}
                transition={{
                  duration: reducedMotion ? 0 : 0.8,
                  delay: reducedMotion ? 0 : 0.12,
                  ease: easePremium,
                }}
              >
                نظم قضاياك وعملاءك ومستنداتك وفواتيرك في نظام واحد. وفعّل بوابة عميل آمنة لمتابعة القضايا والمستندات المشتركة.
                مع مساعد ذكي يساعدك في التحليل والصياغة والبحث في الأنظمة السعودية.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8"
                initial={fadeUpInitial}
                animate={fadeUpAnimate}
                transition={{
                  duration: reducedMotion ? 0 : 0.7,
                  delay: reducedMotion ? 0 : 0.18,
                  ease: easePremium,
                }}
              >
                <Badge variant="secondary" className="bg-gold/10 text-gold border border-gold/20">إدارة قضايا</Badge>
                <Badge variant="secondary" className="bg-gold/10 text-gold border border-gold/20">بوابة عميل</Badge>
                <Badge variant="secondary" className="bg-gold/10 text-gold border border-gold/20">مستندات وفواتير</Badge>
                <Badge variant="secondary" className="bg-gold/10 text-gold border border-gold/20">ذكاء اصطناعي قانوني</Badge>
              </motion.div>
              
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={fadeUpInitial}
                animate={fadeUpAnimate}
                transition={{
                  duration: reducedMotion ? 0 : 0.7,
                  delay: reducedMotion ? 0 : 0.22,
                  ease: easePremium,
                }}
              >
                <Button
                  className="btn-gold text-lg px-8 py-6"
                  onClick={() => setLocation(user ? "/dashboard" : "/signup?mode=trial")}
                >
                  {user ? "لوحة التحكم" : "ابدأ الآن مجاناً"}
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </Button>
                <Button
                  variant="outline"
                  className="text-lg px-8 py-6 border-gold/30 hover:border-gold/50 hover:bg-gold/5"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  اكتشف المزيد
                </Button>
              </motion.div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
                {outcomes.map((o, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: reducedMotion ? 0 : 16, scale: reducedMotion ? 1 : 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.65,
                      delay: reducedMotion ? 0 : 0.04 * i,
                      ease: easePremium,
                    }}
                  >
                    <Card className="card-gold">
                      <CardContent className="px-6 py-5">
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">{o.label}</div>
                            <div className="text-base font-semibold text-foreground">{o.value}</div>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                            <o.icon className="h-5 w-5 text-gold" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="flex-1 relative">
              <div className="relative w-full max-w-lg mx-auto">
                {/* Main Card */}
                <motion.div
                  className="relative z-10 p-8 rounded-2xl card-gold"
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.85,
                    delay: reducedMotion ? 0 : 0.18,
                    ease: easePremium,
                  }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shadow-lg backdrop-blur-sm">
                      <img src="/logo.png" alt="موازين" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">موازين</h3>
                      <p className="text-sm text-gold font-medium">المساعد القانوني الذكي</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/8 border border-white/15 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-gold" />
                        <span className="text-sm font-medium text-foreground">تحليل قضية</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        "حلل لي هذه القضية التجارية وحدد الثغرات القانونية المحتملة..."
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-white/8 border border-white/15 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-gold" />
                        <span className="text-sm font-medium text-gold">رد المساعد</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        سأحتاج بعض التفاصيل (نوع الدعوى، المحكمة/الجهة، التسلسل الزمني) ثم أقدّم لك مسارات نظامية محتملة ومخاطر ومتطلبات.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/8 border border-white/15 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <BadgeCheck className="h-4 w-4 text-gold" />
                        <span className="text-sm font-medium text-foreground">بوابة العميل</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        أنشئ رابطًا آمنًا للعميل لعرض القضايا والفواتير والدفعات والمستندات المشتركة.
                      </p>
                    </div>
                  </div>
                </motion.div>
                
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

      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">كيف يعمل موازين؟</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">رحلة واضحة من تنظيم البيانات إلى مشاركة ذكية وتجربة عميل احترافية.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <Card key={idx} className="border-border/50 hover:border-gold/30 transition-colors">
                <CardHeader className="px-6">
                  <CardTitle className="text-right flex items-start justify-between gap-4">
                    <span className="leading-snug">{s.title}</span>
                    <span className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold">{idx + 1}</span>
                  </CardTitle>
                  <CardDescription className="text-right">{s.description}</CardDescription>
                </CardHeader>
              </Card>
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

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button className="btn-gold" onClick={() => setLocation("/signup?mode=trial")}>ابدأ التجربة</Button>
                <Button variant="outline" className="border-gold/30 hover:border-gold/50 hover:bg-gold/5" onClick={() => setLocation("/legal-tools")}
                >
                  استكشف الأدوات القانونية
                </Button>
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
                  
                  <div className="space-y-3 max-h-96 overflow-auto pr-1">
                    {supportedSystems.map((system, index) => (
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

      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
                <Users className="h-4 w-4 text-gold" />
                <span className="text-sm text-gold">بوابة العميل</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                تجربة عميل احترافية برابط واحد
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                بدل الرسائل المتفرقة… اعط العميل لوحة متابعة واضحة تُظهر القضايا والجلسات والفواتير والدفعات والمستندات المشتركة فقط.
                أنت تتحكم بالكامل فيما يتم مشاركته.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Lock, text: "رابط آمن لكل عميل" },
                  { icon: FileText, text: "مستندات مشتركة فقط" },
                  { icon: Search, text: "جدول زمني مرتب" },
                  { icon: Shield, text: "تحكم كامل بالصلاحيات" },
                ].map((it, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <it.icon className="h-5 w-5 text-gold" />
                    <span className="text-foreground">{it.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Button className="btn-gold" onClick={() => setLocation("/signup?mode=trial")}>فعّل بوابة العميل الآن</Button>
              </div>
            </div>

            <div className="flex-1 w-full">
              <Card className="border-gold/20 shadow-xl">
                <CardHeader className="px-6">
                  <CardTitle className="text-right">مثال سريع</CardTitle>
                  <CardDescription className="text-right">شكل مبسّط لما يراه العميل عبر الرابط</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "القضايا", value: "1" },
                      { label: "الفواتير", value: "1" },
                      { label: "المدفوعات", value: "1" },
                      { label: "المستندات", value: "1" },
                    ].map((x, idx) => (
                      <div key={idx} className="rounded-xl border border-border/50 bg-secondary/40 p-4 text-right">
                        <div className="text-sm text-muted-foreground">{x.label}</div>
                        <div className="text-2xl font-bold text-foreground">{x.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-border/50 bg-background/60 p-4 text-right">
                    <div className="text-sm font-medium text-foreground mb-2">الجدول الزمني</div>
                    <div className="space-y-2">
                      {[
                        "فاتورة #INV-...",
                        "دفعة",
                        "قضية جديدة",
                        "مستند مشترك",
                      ].map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 p-3">
                          <span className="text-xs text-muted-foreground">اليوم</span>
                          <span className="text-sm text-foreground">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">آراء العملاء</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">تجارب واقعية تعكس قيمة التنظيم والشفافية وتجربة العميل.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <Card key={idx} className="border-border/50 hover:border-gold/30 transition-colors">
                <CardContent className="px-6 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-gold" />
                      ))}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Quote className="h-5 w-5 text-gold" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed text-right">{t.quote}</p>
                  <div className="mt-6 text-right">
                    <div className="font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.org}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gold/3">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">باقات مرنة تناسبك</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">ابدأ بسرعة، ثم اختر الباقة الأنسب عندما تتوسع احتياجاتك.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTeaser.map((p, idx) => (
              <Card key={idx} className="border-border/50 hover:border-gold/30 transition-colors">
                <CardHeader className="px-6">
                  <CardTitle className="text-right">{p.title}</CardTitle>
                  <CardDescription className="text-right">{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-3">
                    {p.bullets.map((b, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                        <span className="text-foreground">{b}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-gold" onClick={() => setLocation("/signup?mode=trial")}>ابدأ مجانًا</Button>
            <Button variant="outline" className="border-gold/30 hover:border-gold/50 hover:bg-gold/5" onClick={() => setLocation("/pricing")}>
              اطلع على الأسعار
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">أسئلة شائعة</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">إجابات مختصرة على أكثر الأسئلة تكرارًا قبل البدء.</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible>
              {faqs.map((f, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger className="text-right">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-right text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gold/3">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              ابدأ في استخدام موازين اليوم
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              انضم إلى مئات المحامين الذين يستخدمون موازين لإدارة مكاتبهم بكفاءة أعلى
            </p>
            <Button
              className="btn-gold text-lg px-10 py-6"
              onClick={() => setLocation("/signup?mode=trial")}
            >
              ابدأ الآن مجاناً
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Button>
            <div className="mt-6 text-sm text-muted-foreground">
              لديك حساب؟
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="text-gold hover:text-gold/80 font-medium mr-2"
              >
                سجّل الدخول
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
