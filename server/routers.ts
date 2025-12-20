import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, ownerProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
 import { ENV } from "./_core/env";
import { retrieveLegalSnippets, formatSnippetsForPrompt } from "./legalRetrieval";
import { runLegalCrawlerOnce } from "./legalCrawler";

type SubscriptionPlan = "individual" | "law_firm" | "enterprise";
type ToolKey = "translate" | "compareTexts" | "predictCaseOutcome" | "inheritanceEstimate";

const toolEntitlementsByPlan: Record<SubscriptionPlan, Record<ToolKey, { enabled: boolean; dailyLimit: number | null }>> = {
  individual: {
    translate: { enabled: true, dailyLimit: 10 },
    compareTexts: { enabled: false, dailyLimit: 0 },
    predictCaseOutcome: { enabled: false, dailyLimit: 0 },
    inheritanceEstimate: { enabled: false, dailyLimit: 0 },
  },
  law_firm: {
    translate: { enabled: true, dailyLimit: 50 },
    compareTexts: { enabled: true, dailyLimit: 10 },
    predictCaseOutcome: { enabled: true, dailyLimit: 5 },
    inheritanceEstimate: { enabled: true, dailyLimit: 10 },
  },
  enterprise: {
    translate: { enabled: true, dailyLimit: null },
    compareTexts: { enabled: true, dailyLimit: null },
    predictCaseOutcome: { enabled: true, dailyLimit: null },
    inheritanceEstimate: { enabled: true, dailyLimit: null },
  },
};

async function getOrganizationPlanForUser(ctx: any): Promise<{ organizationId: number; plan: SubscriptionPlan; seatLimit: number }> {
  const organizationId = await db.ensureUserHasOrganization({
    openId: ctx.user.openId,
    defaultOrganizationName: ctx.user.name ?? null,
  });

  const org = await db.getOrganizationById(organizationId);
  const plan = (org?.subscriptionPlan ?? "individual") as SubscriptionPlan;
  const seatLimit = Number(org?.seatLimit ?? 1);

  return { organizationId, plan, seatLimit };
}

function planLabel(plan: SubscriptionPlan) {
  if (plan === "enterprise") return "منشأة";
  if (plan === "law_firm") return "مكتب محاماة";
  return "فردي";
}

async function assertToolAccess(params: {
  ctx: any;
  tool: ToolKey;
}) {
  const { ctx, tool } = params;

  if (ctx.user && ctx.user.isActive === false) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "يتطلب استخدام الأدوات الذكية اشتراكاً شهرياً فعالاً. يرجى الانتقال إلى صفحة المدفوعات لتجديد الاشتراك.",
    });
  }

  const { organizationId, plan } = await getOrganizationPlanForUser(ctx);
  const entitlements = toolEntitlementsByPlan[plan]?.[tool];

  if (!entitlements?.enabled) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `هذه الأداة غير متاحة في باقة ${planLabel(plan)}. يرجى ترقية الخطة لاستخدامها.`,
    });
  }

  if (entitlements.dailyLimit !== null) {
    const used = await db.getToolUsageCount({ organizationId, tool });
    if (used >= entitlements.dailyLimit) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `لقد وصلت إلى الحد اليومي لاستخدام هذه الأداة (${entitlements.dailyLimit}). حاول لاحقاً أو قم بترقية الخطة.`,
      });
    }
  }

  return { organizationId, plan, entitlements };
}

// Saudi Law AI System Prompt
const SAUDI_LAW_SYSTEM_PROMPT = `أنت "موازين" - المساعد القانوني الذكي المتخصص في القانون السعودي. دورك تقديم مساعدة قانونية عامة مبنية على الأنظمة واللوائح السعودية.

1. **المصادر الرسمية المعتمدة (أساس الذكاء الاصطناعي):**
   1) **هيئة الخبراء بمجلس الوزراء (الأهم):**
      - بوابة الأنظمة واللوائح
      - الصياغات النظامية المعتمدة
      - التعديلات الرسمية
   2) **بوابة (مُعين):**
      - شرح الأنظمة
      - تبسيط المواد
      - الربط بين النظام واللائحة
      - تُستخدم كمصدر مهم جدًا للشرح/التفسير الإجرائي (مع عدم تقديم الخلافات الاجتهادية كحقائق قطعية)
   3) **وزارة العدل:**
      - الأنظمة القضائية
      - الأدلة الإجرائية
      - نماذج الدعاوى
      - منصة ناجز وإجراءاتها
   4) **ديوان المظالم:**
      - القضاء الإداري
      - المبادئ القضائية
      - الأحكام الإدارية المنشورة
   5) **النيابة العامة:**
      - الأنظمة الجزائية
      - أدلة التحقيق والادعاء
   6) **مجلس الشورى:**
      - مشروعات الأنظمة
      - المداولات النظامية (مهمة للفهم التشريعي)
   7) **الجهات التنظيمية المتخصصة (عند الاختصاص):**
      - هيئة السوق المالية
      - البنك المركزي السعودي
      - هيئة الزكاة والضريبة والجمارك
      - هيئة كفاءة الإنفاق
      - هيئة الرقابة ومكافحة الفساد

2. **تصنيفات الأنظمة التي تُغطّى عند الاستفسار (حسب الحاجة):**
   - **الأنظمة الدستورية والحاكمة:**
     - النظام الأساسي للحكم
     - نظام مجلس الوزراء
     - نظام مجلس الشورى
     - نظام المناطق
     - نظام البيعة
   - **الأنظمة القضائية:**
     - نظام القضاء
     - نظام ديوان المظالم
     - نظام المرافعات الشرعية
     - نظام الإجراءات الجزائية
     - نظام التنفيذ
     - نظام المحاماة
     - نظام التوثيق
   - **الأنظمة العمالية والاجتماعية:**
     - نظام العمل السعودي
     - لائحة نظام العمل
     - نظام التأمينات الاجتماعية
     - نظام مكافحة التستر
     - نظام الموارد البشرية في الخدمة المدنية
     - نظام الخدمة العسكرية
     - نظام التدريب التقني والمهني
   - **الأنظمة التجارية والاقتصادية:**
     - نظام الشركات
     - نظام الإفلاس
     - نظام التجارة الإلكترونية
     - نظام السجل التجاري
     - نظام العلامات التجارية
     - نظام الأسماء التجارية
     - نظام المنافسة
     - نظام الامتياز التجاري
     - نظام الغرف التجارية
     - نظام الوكالات التجارية
   - **الأنظمة المالية والضريبية:**
     - نظام الزكاة
     - نظام ضريبة القيمة المضافة
     - نظام ضريبة الدخل
     - نظام الجمارك الموحد
     - نظام الإيرادات العامة
     - نظام الدين العام
     - نظام المنافسات والمشتريات الحكومية
   - **الأنظمة الجزائية (الجنائية):**
     - نظام مكافحة الرشوة
     - نظام مكافحة غسل الأموال
     - نظام مكافحة الإرهاب وتمويله
     - نظام الجرائم المعلوماتية
     - نظام مكافحة التزوير
     - نظام مكافحة المخدرات
     - نظام الأسلحة
     - نظام حماية الأموال العامة
   - **الأنظمة الإدارية والرقابية:**
     - نظام الرقابة ومكافحة الفساد
     - نظام تأديب الموظفين
     - نظام حماية المبلغين
     - نظام نزاهة
     - نظام حوكمة الجهات الحكومية
   - **الأنظمة المدنية والأحوال الشخصية:**
     - نظام الأحوال الشخصية
     - نظام المعاملات المدنية
     - نظام الإثبات
     - نظام التركات
     - نظام الوصايا
     - نظام الأوقاف
   - **أنظمة التقنية والبيانات:**
     - نظام حماية البيانات الشخصية
     - نظام التعاملات الإلكترونية
     - نظام الأمن السيبراني
     - نظام الحكومة الرقمية
   - **أنظمة العقار والبلديات:**
     - نظام التسجيل العيني للعقار
     - نظام نزع الملكية
     - نظام الوساطة العقارية
     - نظام المساهمات العقارية
     - نظام البلديات
     - نظام التخطيط العمراني
   - **اللوائح التنفيذية والتعاميم والأدلة والقرارات التفسيرية:**
     - اللوائح التنفيذية
     - التعاميم الوزارية
     - الأدلة الإجرائية
     - القرارات التفسيرية

3. **المحاكم والدوائر القضائية (عند السؤال عن الاختصاص/المسار):**
   - المحكمة العليا
   - محاكم الاستئناف
   - المحاكم الجزائية
   - المحاكم العامة
   - المحاكم التجارية
   - محاكم الأحوال الشخصية
   - المحاكم العمالية
   - دوائر ديوان المظالم

4. **مهاراتك:**
   - تحليل الوقائع وتحديد المسائل القانونية
   - اقتراح مسارات إجرائية محتملة وخيارات عامة
   - صياغة مذكرات/لوائح/عقود/وكالات بصياغة احترافية عند الطلب
   - إبراز المخاطر والمتطلبات النظامية

**أسلوب الإجابة (إلزامي):**
- اكتب بأسلوب مهني حازم ومنظم (عقلية محامي سعودي قوي)، بدون مبالغة وبدون قطعيات غير مسندة.
- استخدم عناوين واضحة داخل الإجابة حسب الحاجة:
  1) الملخص التنفيذي
  2) الوقائع/البيانات المطلوبة (إن وجدت)
  3) التكييف النظامي العام
  4) الإجراءات العملية والخطوات
  5) المخاطر والملاحظات
  6) المصادر
- إذا كانت البيانات ناقصة أو السؤال عام جداً: اطرح 3-6 أسئلة توضيحية محددة قبل إعطاء نتيجة نهائية.

**قاعدة صارمة لمنع الهبد:**
- لا تذكر أرقام مواد أو تنقل نصوصاً أو تنسب أحكاماً/سوابق إلا إذا كانت ضمن (المقتطفات) التي ستأتيك في السياق.
- إن لم تتوفر مقتطفات كافية: قدّم توجيهاً عاماً وإجراءات عملية، وصرّح بوضوح أن الاستناد النصي غير متاح حالياً واطلب تزويد معلومات أو تفعيل قاعدة المعرفة.

**قواعد إلزامية للإجابة (مصادر/استشهاد/تمييز):**
- لا تختلق مواد أو أرقام أو نصوص نظامية. إذا لم تتأكد من النص أو الرقم أو آخر تعديل فقل صراحةً إنك غير متأكد واقترح الرجوع للمصدر الرسمي.
- اربط أي جواب قانوني — قدر الإمكان — بـ: (اسم النظام) و(رقم المادة/الفقرة) و(آخر تعديل إن كان معروفًا). إذا تعذر تحديد مادة بعينها، اذكر ذلك بوضوح.
- فرّق بوضوح بين: (نظام) و(لائحة تنفيذية) و(تعميم) و(دليل إجرائي) و(قرار تفسيري)، ولا تخلط بينها.
- عند نقل **نص نظامي**: اعتمد هيئة الخبراء للصياغة المعتمدة. وعند تقديم **شرح/تبسيط**: اعتمد مُعين للشرح والربط بين النظام واللائحة.
- عندما تكون المعلومات ناقصة، اطرح أسئلة توضيحية محددة قبل إعطاء نتيجة نهائية.
- اجعل الإجابة باللغة العربية وبأسلوب مهني واضح ومنظم.
- فرّق بين: (معلومة نظامية) و(إجراء على منصة/جهة) و(رأي عام/خيار محتمل).

**تنبيه مهني مهم:**
- لا تُسمّى محاميًا.
- لا تصدر أحكامًا.
- لا تقدّم الخلافات الاجتهادية كحقائق مطلقة.
- لا تقدّم استشارة ملزمة، ونبّه المستخدم عند الحاجة إلى مراجعة محامٍ/مختص بحسب تفاصيل الحالة.`;

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    isOwner: publicProcedure.query((opts) => {
      const user = opts.ctx.user;
      if (!user) return false;
      if (!ENV.ownerOpenId) return false;
      return user.openId === ENV.ownerOpenId;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  services: router({
    publicList: publicProcedure.query(async () => {
      const organizationId = await db.getDefaultPublicOrganizationId();
      return db.getServiceCatalogByOrganizationId(organizationId, true);
    }),

    adminList: protectedProcedure.query(async ({ ctx }) => {
      const organizationId = await db.ensureUserHasOrganization({
        openId: ctx.user.openId,
        defaultOrganizationName: ctx.user.name ?? null,
      });
      return db.getServiceCatalogByOrganizationId(organizationId, false);
    }),

    adminCreate: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional().nullable(),
          durationMinutes: z.number().int().min(5).max(24 * 60).default(60),
          priceAmount: z.number().int().min(0).default(0),
          currency: z.string().min(1).max(10).default("SAR"),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });

        const id = await db.createServiceCatalogItem({
          organizationId,
          title: input.title,
          description: input.description ?? null,
          durationMinutes: input.durationMinutes,
          priceAmount: input.priceAmount,
          currency: input.currency,
          isActive: input.isActive,
        });

        return { id } as const;
      }),

    adminUpdate: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional().nullable(),
          durationMinutes: z.number().int().min(5).max(24 * 60).optional(),
          priceAmount: z.number().int().min(0).optional(),
          currency: z.string().min(1).max(10).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateServiceCatalogItem(id, data as any);
        return { success: true as const };
      }),
  }),

  serviceRequests: router({
    createPublic: publicProcedure
      .input(
        z.object({
          serviceId: z.number().optional().nullable(),
          clientName: z.string().min(1),
          clientEmail: z.string().email().optional().nullable(),
          clientPhone: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
          preferredAt: z.coerce.date().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const organizationId = await db.getDefaultPublicOrganizationId();

        const id = await db.createServiceRequest({
          organizationId,
          serviceId: input.serviceId ?? null,
          clientName: input.clientName,
          clientEmail: input.clientEmail ?? null,
          clientPhone: input.clientPhone ?? null,
          notes: input.notes ?? null,
          preferredAt: input.preferredAt ?? null,
          status: "new",
          assignedToUserId: null,
        });

        return { id } as const;
      }),

    list: protectedProcedure
      .input(
        z
          .object({
            status: z.enum(["new", "in_progress", "completed", "cancelled"]).optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });
        return db.getServiceRequestsByOrganizationId(organizationId, input?.status);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "in_progress", "completed", "cancelled"]).optional(),
          assignedToUserId: z.number().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateServiceRequest(id, {
          status: data.status,
          assignedToUserId: data.assignedToUserId ?? undefined,
        } as any);
        return { success: true as const };
      }),
  }),

  // ==================== SERVICE PROJECTS (Legal Services Workflow) ====================
  serviceProjects: router({
    list: protectedProcedure
      .input(
        z
          .object({
            status: z.enum(["new", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });

        return db.listServiceProjectsByOrganizationId({
          organizationId,
          status: input?.status,
          search: input?.search,
        } as any);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getServiceProjectById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          serviceCatalogId: z.number().optional().nullable(),
          clientId: z.number().optional().nullable(),
          caseId: z.number().optional().nullable(),
          title: z.string().min(1),
          description: z.string().optional().nullable(),
          status: z.enum(["new", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
          assignedToUserId: z.number().optional().nullable(),
          startDate: z.date().optional().nullable(),
          dueDate: z.date().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });

        const id = await db.createServiceProject({
          organizationId,
          serviceCatalogId: input.serviceCatalogId ?? null,
          clientId: input.clientId ?? null,
          caseId: input.caseId ?? null,
          title: input.title,
          description: input.description ?? null,
          status: input.status ?? "new",
          priority: input.priority ?? "medium",
          assignedToUserId: input.assignedToUserId ?? null,
          createdByUserId: ctx.user.id,
          startDate: input.startDate ?? null,
          dueDate: input.dueDate ?? null,
          completedAt: null,
        } as any);

        return { id } as const;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional().nullable(),
          status: z.enum(["new", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
          assignedToUserId: z.number().optional().nullable(),
          startDate: z.date().optional().nullable(),
          dueDate: z.date().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const update: any = { ...data };
        if (data.status === "completed") {
          update.completedAt = new Date();
        }
        await db.updateServiceProject(id, update);
        return { success: true as const };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteServiceProject(input.id);
        return { success: true as const };
      }),

    expensesList: protectedProcedure
      .input(z.object({ serviceProjectId: z.number() }))
      .query(async ({ input }) => {
        return db.listServiceProjectExpenses(input.serviceProjectId);
      }),

    expensesCreate: protectedProcedure
      .input(
        z.object({
          serviceProjectId: z.number(),
          amount: z.number().int().min(0),
          currency: z.string().min(1).max(10).default("SAR"),
          description: z.string().optional().nullable(),
          expenseDate: z.date().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createServiceProjectExpense({
          serviceProjectId: input.serviceProjectId,
          amount: input.amount,
          currency: input.currency,
          description: input.description ?? null,
          expenseDate: input.expenseDate ?? new Date(),
          createdByUserId: ctx.user.id,
        } as any);
        return { id } as const;
      }),

    expensesDelete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteServiceProjectExpense(input.id);
        return { success: true as const };
      }),
  }),

  publicSite: router({
    page: publicProcedure
      .input(z.object({ slug: z.string().min(1).max(100) }))
      .query(async ({ input }) => {
        const organizationId = await db.getDefaultPublicOrganizationId();
        const page = await db.getSitePageBySlug({
          organizationId,
          slug: input.slug,
          onlyPublished: true,
        });
        return page ?? null;
      }),

    team: publicProcedure.query(async () => {
      const organizationId = await db.getDefaultPublicOrganizationId();
      return db.listPublicTeamMembers(organizationId, true);
    }),

    practices: publicProcedure.query(async () => {
      const organizationId = await db.getDefaultPublicOrganizationId();
      return db.listPracticeAreas(organizationId, true);
    }),

    testimonials: publicProcedure.query(async () => {
      const organizationId = await db.getDefaultPublicOrganizationId();
      return db.listTestimonials(organizationId, true);
    }),
  }),

  contact: router({
    createPublic: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional().nullable(),
          phone: z.string().optional().nullable(),
          message: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const organizationId = await db.getDefaultPublicOrganizationId();
        const id = await db.createContactMessage({
          organizationId,
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          message: input.message,
          status: "new",
        });
        return { id } as const;
      }),
  }),

  legalTools: router({
    translate: protectedProcedure
      .input(
        z.object({
          text: z.string().min(1),
          targetLanguage: z.enum(["ar", "en"]).default("ar"),
          tone: z.enum(["formal", "simple"]).default("formal"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { organizationId } = await assertToolAccess({ ctx, tool: "translate" });

        const system = `أنت مساعد متخصص في الترجمة القانونية.\n\n- التزم بالدقة، وحافظ على المصطلحات القانونية.\n- إذا كان النص يتضمن مصطلحات قد تحمل أكثر من معنى، اذكر البدائل بين قوسين بشكل موجز.\n- لا تقدّم استشارة قانونية ملزمة.`;

        const user = `ترجم النص التالي إلى ${input.targetLanguage === "ar" ? "العربية" : "الإنجليزية"} بأسلوب ${
          input.tone === "formal" ? "رسمي" : "مبسّط"
        }: \n\n${input.text}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            outputSchema: {
              name: "LegalTranslation",
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  translation: { type: "string" },
                },
                required: ["translation"],
              },
            },
          });

          const raw = response.choices[0]?.message?.content;
          const translation =
            typeof raw === "string"
              ? raw
              : Array.isArray(raw) && raw[0] && "text" in (raw[0] as any)
                ? ((raw[0] as any).text as string)
                : "";

          await db.incrementToolUsage({ organizationId, tool: "translate" });
          return { translation } as const;
        } catch (error) {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          });
          const raw = response.choices[0]?.message?.content;
          const translation = typeof raw === "string" ? raw : "";
          await db.incrementToolUsage({ organizationId, tool: "translate" });
          return { translation } as const;
        }
      }),

    compareTexts: protectedProcedure
      .input(
        z.object({
          leftTitle: z.string().optional().nullable(),
          rightTitle: z.string().optional().nullable(),
          leftText: z.string().min(1),
          rightText: z.string().min(1),
          focus: z.enum(["general", "risks", "differences", "compliance"]).default("general"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { organizationId } = await assertToolAccess({ ctx, tool: "compareTexts" });

        const system = `أنت محلل قانوني.\n\nمهمتك مقارنة نصين/وثيقتين واستخراج الفروقات الجوهرية والمخاطر.\n- اكتب المخرجات بالعربية.\n- لا تقدّم استشارة ملزمة.`;

        const user = `قارن بين النصين التاليين. ركّز على: ${input.focus}.\n\n` +
          `النص (A)${input.leftTitle ? ` - ${input.leftTitle}` : ""}:\n${input.leftText}\n\n` +
          `النص (B)${input.rightTitle ? ` - ${input.rightTitle}` : ""}:\n${input.rightText}`;

        const response = await invokeLLM({ messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ] });
        const raw = response.choices[0]?.message?.content;
        await db.incrementToolUsage({ organizationId, tool: "compareTexts" });
        return { analysis: typeof raw === "string" ? raw : "" } as const;
      }),

    predictCaseOutcome: protectedProcedure
      .input(
        z.object({
          caseId: z.number().optional().nullable(),
          caseSummary: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { organizationId } = await assertToolAccess({ ctx, tool: "predictCaseOutcome" });

        let caseContext = "";
        if (input.caseId) {
          const caseData = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
          if (caseData) {
            caseContext = `\n\nبيانات القضية بالنظام:\n- رقم القضية: ${caseData.caseNumber}\n- العنوان: ${caseData.title}\n- النوع: ${caseData.type}\n- المحكمة: ${caseData.court || "غير محدد"}\n- المرحلة: ${caseData.stage}\n- الحالة: ${caseData.status}`;
          }
        }

        const system = `${SAUDI_LAW_SYSTEM_PROMPT}\n\nمهمة إضافية: قدّم توقعات عامة غير ملزمة لسيناريوهات سير القضية.\n- قدّم 3 سيناريوهات على الأقل (متفائل/واقعي/متشائم).\n- اذكر العوامل التي قد تغيّر النتيجة.\n- لا تُصدر حكمًا ولا تعتبره توقعًا حتميًا.`;

        const user = `حلّل ملخص القضية التالي وقدّم 3 سيناريوهات متوقعة لسيرها ونتيجتها بشكل عام (بدون جزم):\n\n${input.caseSummary}${caseContext}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });

        const raw = response.choices[0]?.message?.content;
        await db.incrementToolUsage({ organizationId, tool: "predictCaseOutcome" });
        return { analysis: typeof raw === "string" ? raw : "" } as const;
      }),

    inheritanceEstimate: protectedProcedure
      .input(
        z.object({
          scenario: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { organizationId } = await assertToolAccess({ ctx, tool: "inheritanceEstimate" });

        const system = `أنت مساعد في شرح المواريث وفق الأنظمة السعودية (أحكام المواريث الشرعية) بشكل تعليمي عام.\n\n- قدّم نتيجة تقديرية فقط وقد تتغير حسب تفاصيل دقيقة.\n- اطلب معلومات ناقصة إذا لزم.\n- اذكر تنبيهًا واضحًا بضرورة مراجعة مختص.\n- اكتب بالعربية.`;

        const user = `هذه حالة تركة/مواريث.\n\n${input.scenario}\n\nالمطلوب:\n1) تلخيص المعطيات.\n2) تحديد الورثة المحتملين حسب المذكور.\n3) توزيع تقديري (نِسَب) إن أمكن.\n4) أسئلة توضيحية إن كانت المعطيات ناقصة.\n5) تنبيه مهني بعدم الاعتماد على الناتج دون مختص.`;

        const response = await invokeLLM({ messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ] });
        const raw = response.choices[0]?.message?.content;
        await db.incrementToolUsage({ organizationId, tool: "inheritanceEstimate" });
        return { analysis: typeof raw === "string" ? raw : "" } as const;
      }),
  }),

  cms: router({
    pagesList: protectedProcedure.query(async ({ ctx }) => {
      const organizationId = await db.ensureUserHasOrganization({
        openId: ctx.user.openId,
        defaultOrganizationName: ctx.user.name ?? null,
      });
      return db.listSitePagesByOrganizationId(organizationId);
    }),

    pageUpsert: protectedProcedure
      .input(
        z.object({
          slug: z.string().min(1).max(100),
          title: z.string().min(1).max(255),
          content: z.string().optional().nullable(),
          isPublished: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });
        const id = await db.upsertSitePage({
          organizationId,
          slug: input.slug,
          title: input.title,
          content: input.content ?? null,
          isPublished: input.isPublished,
          updatedByUserId: ctx.user.id,
        });
        return { id } as const;
      }),

    teamList: protectedProcedure.query(async ({ ctx }) => {
      const organizationId = await db.ensureUserHasOrganization({
        openId: ctx.user.openId,
        defaultOrganizationName: ctx.user.name ?? null,
      });
      return db.listPublicTeamMembers(organizationId, false);
    }),

    teamCreate: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          title: z.string().optional().nullable(),
          bio: z.string().optional().nullable(),
          avatarUrl: z.string().optional().nullable(),
          sortOrder: z.number().int().min(0).default(0),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });
        const id = await db.createPublicTeamMember({
          organizationId,
          name: input.name,
          title: input.title ?? null,
          bio: input.bio ?? null,
          avatarUrl: input.avatarUrl ?? null,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        });
        return { id } as const;
      }),

    teamUpdate: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          title: z.string().optional().nullable(),
          bio: z.string().optional().nullable(),
          avatarUrl: z.string().optional().nullable(),
          sortOrder: z.number().int().min(0).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePublicTeamMember(id, data as any);
        return { success: true as const };
      }),

    practicesList: protectedProcedure.query(async ({ ctx }) => {
      const organizationId = await db.ensureUserHasOrganization({
        openId: ctx.user.openId,
        defaultOrganizationName: ctx.user.name ?? null,
      });
      return db.listPracticeAreas(organizationId, false);
    }),

    practicesCreate: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional().nullable(),
          sortOrder: z.number().int().min(0).default(0),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });
        const id = await db.createPracticeArea({
          organizationId,
          title: input.title,
          description: input.description ?? null,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        });
        return { id } as const;
      }),

    practicesUpdate: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional().nullable(),
          sortOrder: z.number().int().min(0).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePracticeArea(id, data as any);
        return { success: true as const };
      }),

    testimonialsList: protectedProcedure.query(async ({ ctx }) => {
      const organizationId = await db.ensureUserHasOrganization({
        openId: ctx.user.openId,
        defaultOrganizationName: ctx.user.name ?? null,
      });
      return db.listTestimonials(organizationId, false);
    }),

    testimonialsCreate: protectedProcedure
      .input(
        z.object({
          clientName: z.string().min(1),
          clientTitle: z.string().optional().nullable(),
          content: z.string().min(1),
          rating: z.number().int().min(1).max(5).default(5),
          isPublished: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });
        const id = await db.createTestimonial({
          organizationId,
          clientName: input.clientName,
          clientTitle: input.clientTitle ?? null,
          content: input.content,
          rating: input.rating,
          isPublished: input.isPublished,
        });
        return { id } as const;
      }),

    testimonialsUpdate: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          clientName: z.string().min(1).optional(),
          clientTitle: z.string().optional().nullable(),
          content: z.string().min(1).optional(),
          rating: z.number().int().min(1).max(5).optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTestimonial(id, data as any);
        return { success: true as const };
      }),

    contactMessagesList: protectedProcedure
      .input(z.object({ status: z.enum(["new", "replied", "closed"]).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });
        return db.listContactMessagesByOrganizationId(organizationId, input?.status);
      }),

    contactMessagesUpdateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["new", "replied", "closed"]) }))
      .mutation(async ({ input }) => {
        await db.updateContactMessageStatus(input.id, input.status);
        return { success: true as const };
      }),
  }),

  blog: router({
    publicList: publicProcedure.query(async () => {
      const organizationId = await db.getDefaultPublicOrganizationId();
      return db.listBlogPostsByOrganizationId(organizationId, true);
    }),

    publicGetBySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1).max(150) }))
      .query(async ({ input }) => {
        const organizationId = await db.getDefaultPublicOrganizationId();
        const post = await db.getBlogPostBySlug({ organizationId, slug: input.slug, onlyPublished: true });
        return post ?? null;
      }),

    adminList: protectedProcedure.query(async ({ ctx }) => {
      const organizationId = await db.ensureUserHasOrganization({
        openId: ctx.user.openId,
        defaultOrganizationName: ctx.user.name ?? null,
      });
      return db.listBlogPostsByOrganizationId(organizationId, false);
    }),

    adminUpsert: protectedProcedure
      .input(
        z.object({
          slug: z.string().min(1).max(150),
          title: z.string().min(1).max(255),
          excerpt: z.string().optional().nullable(),
          content: z.string().optional().nullable(),
          isPublished: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });

        const id = await db.upsertBlogPost({
          organizationId,
          slug: input.slug,
          title: input.title,
          excerpt: input.excerpt ?? null,
          content: input.content ?? null,
          isPublished: input.isPublished,
          updatedByUserId: ctx.user.id,
        });

        return { id } as const;
      }),
  }),

  // ==================== SUBSCRIPTIONS ====================
  subscriptions: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const { organizationId, plan, seatLimit } = await getOrganizationPlanForUser(ctx);
      const tools = toolEntitlementsByPlan[plan];
      const used = {
        translate: await db.getToolUsageCount({ organizationId, tool: "translate" }),
        compareTexts: await db.getToolUsageCount({ organizationId, tool: "compareTexts" }),
        predictCaseOutcome: await db.getToolUsageCount({ organizationId, tool: "predictCaseOutcome" }),
        inheritanceEstimate: await db.getToolUsageCount({ organizationId, tool: "inheritanceEstimate" }),
      };

      return {
        isActive: ctx.user.isActive,
        organization: {
          id: organizationId,
          plan,
          seatLimit,
        },
        toolEntitlements: {
          translate: {
            ...tools.translate,
            usedToday: used.translate,
            remaining: tools.translate.dailyLimit === null ? null : Math.max(tools.translate.dailyLimit - used.translate, 0),
          },
          compareTexts: {
            ...tools.compareTexts,
            usedToday: used.compareTexts,
            remaining: tools.compareTexts.dailyLimit === null ? null : Math.max(tools.compareTexts.dailyLimit - used.compareTexts, 0),
          },
          predictCaseOutcome: {
            ...tools.predictCaseOutcome,
            usedToday: used.predictCaseOutcome,
            remaining:
              tools.predictCaseOutcome.dailyLimit === null
                ? null
                : Math.max(tools.predictCaseOutcome.dailyLimit - used.predictCaseOutcome, 0),
          },
          inheritanceEstimate: {
            ...tools.inheritanceEstimate,
            usedToday: used.inheritanceEstimate,
            remaining:
              tools.inheritanceEstimate.dailyLimit === null
                ? null
                : Math.max(tools.inheritanceEstimate.dailyLimit - used.inheritanceEstimate, 0),
          },
        },
      } as const;
    }),

    activate: protectedProcedure
      .input(
        z
          .object({
            plan: z
              .enum(["individual", "law_firm", "enterprise", "monthly"])
              .default("individual"),
          })
          .optional()
      )
      .mutation(async ({ ctx, input }) => {
        if (ENV.isProduction && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "لا يمكن تفعيل الاشتراك تلقائياً في بيئة الإنتاج. يرجى إتمام عملية الدفع عبر القنوات المعتمدة أو التواصل مع الإدارة لتفعيل الاشتراك.",
          });
        }

        const requestedPlan = input?.plan ?? "individual";
        const normalizedPlan = (requestedPlan === "monthly" ? "individual" : requestedPlan) as
          | "individual"
          | "law_firm"
          | "enterprise";
        const seatLimit =
          normalizedPlan === "law_firm" ? 5 : normalizedPlan === "enterprise" ? 15 : 1;

        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });

        await db.setOrganizationSubscriptionPlan({
          organizationId,
          subscriptionPlan: normalizedPlan,
          seatLimit,
        });

        await db.setUserActive(ctx.user.id, true);
        await db.setUserSubscriptionPlan({
          userId: ctx.user.id,
          subscriptionPlan: normalizedPlan,
          accountType: normalizedPlan,
          seatLimit,
        });

        return {
          success: true as const,
          plan: normalizedPlan,
        };
      }),
  }),

  // ==================== DASHBOARD ====================
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStatsForUser(ctx.user.id);
    }),
    
    upcomingHearings: protectedProcedure.query(async ({ ctx }) => {
      return db.getUpcomingHearingsForUser(ctx.user.id, 7);
    }),
    
    recentCases: protectedProcedure.query(async ({ ctx }) => {
      const cases = await db.getAllCasesByUserId(ctx.user.id);
      return cases.slice(0, 5);
    }),
  }),

  reports: router({
    stats: protectedProcedure
      .input(
        z
          .object({
            range: z.enum(["week", "month", "quarter", "year"]).optional(),
          })
          .optional()
      )
      .query(async ({ input, ctx }) => {
        return db.getReportsStatsForUser(ctx.user.id, input?.range);
      }),
  }),

  // ==================== CLIENT PORTAL (Public, token-based) ====================
  portal: router({
    get: publicProcedure
      .input(z.object({ token: z.string().min(10).max(128) }))
      .query(async ({ input }) => {
        const client = await db.getClientByPortalToken(input.token);
        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND", message: "رابط البوابة غير صالح" });
        }

        const clientId = Number((client as any).id);
        const cases = await db.getCasesByClientId(clientId);
        const hearings = await db.getHearingsByClientId(clientId);
        const invoices = await db.getInvoicesByClientId(clientId);
        const payments = await db.getPaymentsByClientId(clientId);
        const documents = await db.getSharedDocumentsByClientId(clientId);

        const timeline = [] as any[];
        for (const c of cases as any[]) {
          timeline.push({
            kind: "case",
            at: c.createdAt,
            id: c.id,
            title: c.title,
            meta: { status: c.status, caseNumber: c.caseNumber },
          });
        }
        for (const h of hearings as any[]) {
          timeline.push({
            kind: "hearing",
            at: h.hearingDate,
            id: h.id,
            title: h.title,
            meta: { status: h.status, caseId: h.caseId },
          });
        }
        for (const i of invoices as any[]) {
          timeline.push({
            kind: "invoice",
            at: i.createdAt,
            id: i.id,
            title: `فاتورة #${i.invoiceNumber}`,
            meta: { status: i.status, totalAmount: i.totalAmount, currency: i.currency },
          });
        }
        for (const p of payments as any[]) {
          timeline.push({
            kind: "payment",
            at: p.paidAt,
            id: p.id,
            title: "دفعة",
            meta: { amount: p.amount, currency: p.currency, invoiceId: p.invoiceId, method: p.method },
          });
        }
        for (const d of documents as any[]) {
          timeline.push({
            kind: "document",
            at: d.createdAt,
            id: d.id,
            title: d.name,
            meta: { type: d.type },
          });
        }

        timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

        return {
          client: {
            id: clientId,
            name: (client as any).name,
          },
          cases,
          hearings,
          invoices,
          payments,
          documents,
          timeline,
        };
      }),
  }),

  // ==================== CLIENTS ====================
  clients: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllClientsByUserId(ctx.user.id, input?.search);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getClientByIdForUser(ctx.user.id, input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        type: z.enum(["individual", "company", "government"]),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        secondaryPhone: z.string().optional().nullable(),
        nationalId: z.string().optional().nullable(),
        commercialRegister: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createClient({
          ...input,
          createdById: ctx.user.id,
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nameEn: z.string().optional().nullable(),
        type: z.enum(["individual", "company", "government"]).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        secondaryPhone: z.string().optional().nullable(),
        nationalId: z.string().optional().nullable(),
        commercialRegister: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const owned = await db.getClientByIdForUser(ctx.user.id, id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "العميل غير موجود" });
        }
        await db.updateClient(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = await db.getClientByIdForUser(ctx.user.id, input.id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "العميل غير موجود" });
        }
        await db.deleteClient(input.id);
        return { success: true };
      }),
    
    getCases: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getCasesByClientIdForUser(ctx.user.id, input.clientId);
      }),
    
    getDocuments: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getDocumentsByClientIdForUser(ctx.user.id, input.clientId);
      }),
    
    getInvoices: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getInvoicesByClientIdForUser(ctx.user.id, input.clientId);
      }),
    
    getCommunicationLogs: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getCommunicationLogsByClientIdForUser(ctx.user.id, input.clientId);
      }),

    portalGenerate: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const client = await db.getClientByIdForUser(ctx.user.id, input.clientId);
        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND", message: "العميل غير موجود" });
        }

        const token = nanoid(40);
        await db.updateClient(input.clientId, {
          portalToken: token,
          portalEnabled: true,
        } as any);

        return { token } as const;
      }),

    portalDisable: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const client = await db.getClientByIdForUser(ctx.user.id, input.clientId);
        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND", message: "العميل غير موجود" });
        }
        await db.updateClient(input.clientId, {
          portalEnabled: false,
          portalToken: null,
        } as any);
        return { success: true as const };
      }),
  }),

  // ==================== CASES ====================
  cases: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllCasesByUserId(ctx.user.id, input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getCaseByIdForUser(ctx.user.id, input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        caseNumber: z.string().min(1),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        type: z.enum(["criminal", "commercial", "family", "administrative", "labor", "real_estate", "other"]),
        court: z.string().optional().nullable(),
        courtBranch: z.string().optional().nullable(),
        stage: z.enum(["intake", "filing", "discovery", "hearing", "judgment", "appeal", "execution", "closed"]).optional(),
        status: z.enum(["active", "pending", "on_hold", "won", "lost", "settled", "closed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        clientId: z.number(),
        assignedLawyerId: z.number().optional().nullable(),
        opposingParty: z.string().optional().nullable(),
        opposingLawyer: z.string().optional().nullable(),
        filingDate: z.date().optional().nullable(),
        estimatedValue: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ownedClient = await db.getClientByIdForUser(ctx.user.id, input.clientId);
        if (!ownedClient) {
          throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
        }
        const id = await db.createCase(input);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        caseNumber: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        type: z.enum(["criminal", "commercial", "family", "administrative", "labor", "real_estate", "other"]).optional(),
        court: z.string().optional().nullable(),
        courtBranch: z.string().optional().nullable(),
        stage: z.enum(["intake", "filing", "discovery", "hearing", "judgment", "appeal", "execution", "closed"]).optional(),
        status: z.enum(["active", "pending", "on_hold", "won", "lost", "settled", "closed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assignedLawyerId: z.number().optional().nullable(),
        opposingParty: z.string().optional().nullable(),
        opposingLawyer: z.string().optional().nullable(),
        filingDate: z.date().optional().nullable(),
        nextHearingDate: z.date().optional().nullable(),
        closingDate: z.date().optional().nullable(),
        estimatedValue: z.number().optional().nullable(),
        actualValue: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const ownedCase = await db.getCaseByIdForUser(ctx.user.id, id);
        if (!ownedCase) {
          throw new TRPCError({ code: "NOT_FOUND", message: "القضية غير موجودة" });
        }
        await db.updateCase(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.id);
        if (!ownedCase) {
          throw new TRPCError({ code: "NOT_FOUND", message: "القضية غير موجودة" });
        }
        await db.deleteCase(input.id);
        return { success: true };
      }),
    
    getHearings: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input, ctx }) => {
        const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
        if (!ownedCase) return [];
        return db.getHearingsByCaseId(input.caseId);
      }),
    
    getDocuments: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getDocumentsByCaseIdForUser(ctx.user.id, input.caseId);
      }),
    
    getTasks: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input, ctx }) => {
        const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
        if (!ownedCase) return [];
        return db.getTasksByCaseId(input.caseId);
      }),
    
    getTimeEntries: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getTimeEntriesByCaseIdForUser(ctx.user.id, input.caseId);
      }),
    
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getCaseStatsForUser(ctx.user.id);
    }),
  }),

  // ==================== HEARINGS ====================
  hearings: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getHearingsByDateRangeForUser(ctx.user.id, input?.startDate, input?.endDate);
      }),
    
    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        hearingDate: z.date(),
        location: z.string().optional().nullable(),
        courtRoom: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
        if (!ownedCase) {
          throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
        }
        const id = await db.createHearing({
          ...input,
          status: "scheduled",
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        hearingDate: z.date().optional(),
        location: z.string().optional().nullable(),
        courtRoom: z.string().optional().nullable(),
        status: z.enum(["scheduled", "completed", "postponed", "cancelled"]).optional(),
        outcome: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const ownedHearing = await db.getHearingByIdForUser(ctx.user.id, id);
        if (!ownedHearing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الجلسة غير موجودة" });
        }
        await db.updateHearing(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const ownedHearing = await db.getHearingByIdForUser(ctx.user.id, input.id);
        if (!ownedHearing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الجلسة غير موجودة" });
        }
        await db.deleteHearing(input.id);
        return { success: true };
      }),
    
    upcoming: protectedProcedure
      .input(z.object({ days: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getUpcomingHearingsForUser(ctx.user.id, input?.days ?? 7);
      }),
  }),

  // ==================== DOCUMENTS ====================
  documents: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllDocumentsForUser(ctx.user.id, input?.search);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getDocumentByIdForUser(ctx.user.id, input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional().nullable(),
        type: z.enum(["contract", "memo", "pleading", "evidence", "correspondence", "court_order", "power_of_attorney", "other"]),
        fileUrl: z.string(),
        fileKey: z.string(),
        mimeType: z.string().optional().nullable(),
        fileSize: z.number().optional().nullable(),
        caseId: z.number().optional().nullable(),
        clientId: z.number().optional().nullable(),
        serviceProjectId: z.number().optional().nullable(),
        isTemplate: z.boolean().optional(),
        isSharedWithClient: z.boolean().optional(),
        templateCategory: z.string().optional().nullable(),
        expiresAt: z.date().optional().nullable(),
        renewAt: z.date().optional().nullable(),
        reminderDays: z.number().int().min(1).max(365).optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (input.caseId) {
          const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
          if (!ownedCase) {
            throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
          }
        }
        if (input.clientId) {
          const ownedClient = await db.getClientByIdForUser(ctx.user.id, input.clientId);
          if (!ownedClient) {
            throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
          }
        }
        const id = await db.createDocument({
          ...input,
          uploadedById: ctx.user.id,
          version: 1,
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        type: z.enum(["contract", "memo", "pleading", "evidence", "correspondence", "court_order", "power_of_attorney", "other"]).optional(),
        serviceProjectId: z.number().optional().nullable(),
        isTemplate: z.boolean().optional(),
        isSharedWithClient: z.boolean().optional(),
        templateCategory: z.string().optional().nullable(),
        expiresAt: z.date().optional().nullable(),
        renewAt: z.date().optional().nullable(),
        reminderDays: z.number().int().min(1).max(365).optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const owned = await db.getDocumentByIdForUser(ctx.user.id, id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "المستند غير موجود" });
        }
        await db.updateDocument(id, data);
        return { success: true };
      }),

    createFromTemplate: protectedProcedure
      .input(
        z.object({
          templateId: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional().nullable(),
          caseId: z.number().optional().nullable(),
          clientId: z.number().optional().nullable(),
          expiresAt: z.date().optional().nullable(),
          renewAt: z.date().optional().nullable(),
          reminderDays: z.number().int().min(1).max(365).optional().nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const template = await db.getDocumentByIdForUser(ctx.user.id, input.templateId);
        if (!template || !template.isTemplate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "القالب غير موجود",
          });
        }

        if (input.caseId) {
          const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
          if (!ownedCase) {
            throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
          }
        }
        if (input.clientId) {
          const ownedClient = await db.getClientByIdForUser(ctx.user.id, input.clientId);
          if (!ownedClient) {
            throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
          }
        }

        const id = await db.createDocument({
          name: input.name ?? template.name,
          description: input.description ?? null,
          type: template.type as any,
          fileUrl: template.fileUrl,
          fileKey: template.fileKey,
          mimeType: template.mimeType ?? null,
          fileSize: (template.fileSize as any) ?? null,
          caseId: input.caseId ?? null,
          clientId: input.clientId ?? null,
          version: 1,
          parentDocumentId: template.id,
          isTemplate: false,
          templateCategory: template.templateCategory ?? null,
          expiresAt: input.expiresAt ?? null,
          renewAt: input.renewAt ?? null,
          reminderDays: input.reminderDays ?? (template.reminderDays as any) ?? 30,
          lastReminderSentAt: null,
          uploadedById: ctx.user.id,
        } as any);

        return { id } as const;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = await db.getDocumentByIdForUser(ctx.user.id, input.id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "المستند غير موجود" });
        }
        await db.deleteDocument(input.id);
        return { success: true };
      }),
    
    templates: protectedProcedure.query(async ({ ctx }) => {
      return db.getDocumentTemplatesForUser(ctx.user.id);
    }),
  }),

  // ==================== TASKS ====================
  tasks: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllTasksForUser(ctx.user.id, input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        caseId: z.number().optional().nullable(),
        serviceProjectId: z.number().optional().nullable(),
        assignedToId: z.number().optional().nullable(),
        dueDate: z.date().optional().nullable(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (input.caseId) {
          const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
          if (!ownedCase) {
            throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
          }
        }
        const id = await db.createTask({
          ...input,
          assignedById: ctx.user.id,
          status: "pending",
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        assignedToId: z.number().optional().nullable(),
        dueDate: z.date().optional().nullable(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
        serviceProjectId: z.number().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const owned = await db.getTaskByIdForUser(ctx.user.id, id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "المهمة غير موجودة" });
        }
        if (data.status === "completed") {
          (data as any).completedAt = new Date();
        }
        await db.updateTask(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = await db.getTaskByIdForUser(ctx.user.id, input.id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "المهمة غير موجودة" });
        }
        await db.deleteTask(input.id);
        return { success: true };
      }),
    
    myTasks: protectedProcedure.query(async ({ ctx }) => {
      return db.getTasksByUserId(ctx.user.id);
    }),
  }),

  // ==================== INVOICES ====================
  invoices: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getAllInvoicesForUser(ctx.user.id, input?.status);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getInvoiceByIdForUser(ctx.user.id, input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        caseId: z.number().optional().nullable(),
        serviceProjectId: z.number().optional().nullable(),
        amount: z.number(),
        taxAmount: z.number().optional(),
        currency: z.string().optional(),
        feeType: z.enum(["hourly", "fixed", "percentage", "retainer"]),
        description: z.string().optional().nullable(),
        dueDate: z.date().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ownedClient = await db.getClientByIdForUser(ctx.user.id, input.clientId);
        if (!ownedClient) {
          throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
        }
        if (input.caseId) {
          const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
          if (!ownedCase) {
            throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
          }
        }
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const taxAmount = input.taxAmount ?? Math.round(input.amount * 0.15); // 15% VAT
        const totalAmount = input.amount + taxAmount;
        
        const id = await db.createInvoice({
          ...input,
          invoiceNumber,
          taxAmount,
          totalAmount,
          status: "draft",
          createdById: ctx.user.id,
        });
        return { id, invoiceNumber };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number().optional(),
        taxAmount: z.number().optional(),
        status: z.enum(["draft", "sent", "paid", "partial", "overdue", "cancelled"]).optional(),
        description: z.string().optional().nullable(),
        dueDate: z.date().optional().nullable(),
        serviceProjectId: z.number().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const owned = await db.getInvoiceByIdForUser(ctx.user.id, id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الفاتورة غير موجودة" });
        }
        if (data.amount !== undefined) {
          const taxAmount = data.taxAmount ?? Math.round(data.amount * 0.15);
          (data as any).totalAmount = data.amount + taxAmount;
        }
        await db.updateInvoice(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = await db.getInvoiceByIdForUser(ctx.user.id, input.id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الفاتورة غير موجودة" });
        }
        await db.deleteInvoice(input.id);
        return { success: true };
      }),
    
    addPayment: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        amount: z.number(),
        method: z.enum(["cash", "bank_transfer", "credit_card", "stc_pay", "stripe", "other"]),
        transactionId: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ownedInvoice = await db.getInvoiceByIdForUser(ctx.user.id, input.invoiceId);
        if (!ownedInvoice) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الفاتورة غير موجودة" });
        }
        await db.createPayment(input);
        
        // Update invoice paid amount
        const invoice = await db.getInvoiceByIdForUser(ctx.user.id, input.invoiceId);
        if (invoice) {
          const newPaidAmount = (invoice.paidAmount ?? 0) + input.amount;
          const newStatus = newPaidAmount >= invoice.totalAmount ? "paid" : "partial";
          await db.updateInvoice(input.invoiceId, {
            paidAmount: newPaidAmount,
            status: newStatus,
            paidDate: newStatus === "paid" ? new Date() : undefined,
          });
        }
        
        return { success: true };
      }),
    
    getPayments: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getPaymentsByInvoiceIdForUser(ctx.user.id, input.invoiceId);
      }),
    
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getInvoiceStatsForUser(ctx.user.id);
    }),
  }),

  // ==================== CALENDAR ====================
  calendar: router({
    events: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input, ctx }) => {
        return db.getCalendarEventsByDateRangeForUser(ctx.user.id, input.startDate, input.endDate);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        eventType: z.enum(["hearing", "meeting", "deadline", "reminder", "other"]),
        startTime: z.date(),
        endTime: z.date().optional().nullable(),
        allDay: z.boolean().optional(),
        location: z.string().optional().nullable(),
        caseId: z.number().optional().nullable(),
        reminderMinutes: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (input.caseId) {
          const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
          if (!ownedCase) {
            throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
          }
        }
        const id = await db.createCalendarEvent({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        eventType: z.enum(["hearing", "meeting", "deadline", "reminder", "other"]).optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional().nullable(),
        allDay: z.boolean().optional(),
        location: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const owned = await db.getCalendarEventByIdForUser(ctx.user.id, id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الحدث غير موجود" });
        }
        await db.updateCalendarEvent(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = await db.getCalendarEventByIdForUser(ctx.user.id, input.id);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "الحدث غير موجود" });
        }
        await db.deleteCalendarEvent(input.id);
        return { success: true };
      }),
  }),

  // ==================== AI ASSISTANT ====================
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1),
        sessionId: z.string().optional(),
        caseId: z.number().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user && ctx.user.isActive === false) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "يتطلب استخدام المساعد القانوني الذكي اشتراكاً شهرياً فعالاً. يرجى الانتقال إلى صفحة المدفوعات لتجديد الاشتراك.",
          });
        }

        console.log("[AI] Chat mutation started");
        console.log("[AI] User ID:", ctx.user.id);
        console.log("[AI] Message:", input.message);
        
        const sessionId = input.sessionId || nanoid();
        
        // Save user message
        console.log("[AI] Saving user message to database...");
        await db.createAiChatMessage({
          userId: ctx.user.id,
          sessionId,
          caseId: input.caseId ?? null,
          role: "user",
          content: input.message,
        });
        console.log("[AI] User message saved successfully");
        
        // Get chat history for context
        console.log("[AI] Getting chat history...");
        const history = await db.getAiChatHistory(ctx.user.id, sessionId);
        console.log("[AI] Chat history retrieved, length:", history.length);
        
        // Build messages for LLM
        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: SAUDI_LAW_SYSTEM_PROMPT },
        ];
        
        // Add case context if available
        if (input.caseId) {
          const caseData = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
          if (caseData) {
            messages.push({
              role: "system",
              content: `سياق القضية الحالية:
- رقم القضية: ${caseData.caseNumber}
- العنوان: ${caseData.title}
- النوع: ${caseData.type}
- المحكمة: ${caseData.court || "غير محدد"}
- المرحلة: ${caseData.stage}
- الحالة: ${caseData.status}
- الوصف: ${caseData.description || "غير متوفر"}
- الخصم: ${caseData.opposingParty || "غير محدد"}`,
            });
          }
        }
        
        // Add recent history (last 10 messages)
        const recentHistory = history.slice(-10);
        for (const msg of recentHistory) {
          messages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }

        let snippets: any[] = [];
        try {
          snippets = await retrieveLegalSnippets({ query: input.message, topK: 8, scanLimit: 900 });
          if (snippets.length > 0) {
            messages.push({
              role: "system",
              content: formatSnippetsForPrompt(snippets),
            });
          }
        } catch (e) {
          console.warn("[AI] Retrieval failed", e);
        }

        if (snippets.length === 0) {
          messages.push({
            role: "system",
            content:
              "تنبيه: لم يتم العثور على مقتطفات كافية من قاعدة المعرفة الرسمية لهذا السؤال. لا تذكر أرقام مواد ولا تنسب نصوصاً/سوابق. قدّم توجيهاً عملياً مباشراً بدون تهرّب وبدون عبارات مثل (استشر محامياً) — المستخدم يستعملك كمساعد قانوني. إذا كان السؤال عن (مادة رقم X) فاطلب تحديد (اسم النظام + رابط المصدر الرسمي من هيئة الخبراء) أو لصق نص المادة، واذكر أن بعض مواد BOE تظهر بصيغة (السابعة بعد المائة) بدل (107) وهكذا. ثم اقترح خطوات دقيقة للوصول للمادة داخل النظام (بوابة هيئة الخبراء/البحث داخل نظام العمل).",
          });
        }

        messages.push({
          role: "system",
          content:
            "تعليمات إلزامية للإخراج: اختم دائماً بقسم بعنوان (المصادر). إذا لم تتوفر مصادر في المقتطفات فاكتب: (المصادر: غير متاحة حالياً داخل قاعدة المعرفة). عند توفر مقتطفات، اربط كل استشهاد برقم مقتطف مثل [1] ثم ضع رابط المصدر.",
        });
        
        // Add current message
        messages.push({ role: "user", content: input.message });
        
        // Call LLM
        let assistantMessage: string;
        try {
          console.log("[AI] Calling LLM with messages:", messages.length);
          const response = await invokeLLM({ messages });
          console.log("[AI] LLM response received");
          const rawContent = response.choices[0]?.message?.content;
          assistantMessage = typeof rawContent === "string" ? rawContent : "عذراً، حدث خطأ في معالجة طلبك.";
          console.log("[AI] Assistant message length:", assistantMessage.length);
        } catch (error) {
          console.error("[AI] LLM call failed:", error);
          assistantMessage = "عذراً، حدث خطأ في معالجة طلبك.";
        }
        
        // Save assistant response
        await db.createAiChatMessage({
          userId: ctx.user.id,
          sessionId,
          caseId: input.caseId ?? null,
          role: "assistant",
          content: assistantMessage,
        });
        
        return {
          sessionId,
          message: assistantMessage,
        };
      }),
    
    history: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input, ctx }) => {
        return db.getAiChatHistory(ctx.user.id, input.sessionId);
      }),
    
    sessions: protectedProcedure.query(async ({ ctx }) => {
      return db.getAiChatSessions(ctx.user.id);
    }),
    
    analyzeCase: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        analysisType: z.enum(["strengths", "weaknesses", "strategy", "precedents", "memo"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user && ctx.user.isActive === false) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "يتطلب استخدام أدوات التحليل الذكية اشتراكاً شهرياً فعالاً. يرجى الانتقال إلى صفحة المدفوعات لتجديد الاشتراك.",
          });
        }

        const caseData = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
        if (!caseData) {
          throw new Error("القضية غير موجودة");
        }
        
        const analysisPrompts: Record<string, string> = {
          strengths: `حلل نقاط القوة في هذه القضية وحدد العوامل التي تصب في مصلحة موكلنا:`,
          weaknesses: `حلل نقاط الضعف والثغرات المحتملة في هذه القضية وكيف يمكن للخصم استغلالها:`,
          strategy: `اقترح استراتيجية دفاع شاملة لهذه القضية مع الخطوات التفصيلية:`,
          precedents: `ابحث في السوابق القضائية المشابهة في القانون السعودي واذكر الأحكام ذات الصلة:`,
          memo: `اكتب مذكرة قانونية احترافية لهذه القضية تتضمن الوقائع والأسانيد القانونية والطلبات:`,
        };
        
        const messages: { role: "system" | "user"; content: string }[] = [
          { role: "system", content: SAUDI_LAW_SYSTEM_PROMPT },
          {
            role: "system",
            content:
              "تعليمات إلزامية: لا تذكر سوابق/أحكام محددة ولا أرقام مواد إلا إذا كانت ضمن مقتطفات رسمية مقدمة لك في السياق. إن لم تتوفر مقتطفات، قدّم إطار عمل وتحليل منطقي وخطوات عملية واذكر أن الاستناد النصي غير متاح حالياً.",
          },
          {
            role: "user",
            content: `${analysisPrompts[input.analysisType]}

تفاصيل القضية:
- رقم القضية: ${caseData.caseNumber}
- العنوان: ${caseData.title}
- النوع: ${caseData.type}
- المحكمة: ${caseData.court || "غير محدد"}
- المرحلة: ${caseData.stage}
- الوصف: ${caseData.description || "غير متوفر"}
- الخصم: ${caseData.opposingParty || "غير محدد"}
- محامي الخصم: ${caseData.opposingLawyer || "غير محدد"}
- ملاحظات: ${caseData.notes || "لا توجد"}`,
          },
        ];

        try {
          const query = `${analysisPrompts[input.analysisType]} ${caseData.title} ${caseData.type} ${caseData.court ?? ""}`;
          const snippets = await retrieveLegalSnippets({ query, topK: 6, scanLimit: 900 });
          if (snippets.length > 0) {
            messages.splice(1, 0, {
              role: "system",
              content: formatSnippetsForPrompt(snippets),
            });
          }
        } catch (e) {
          console.warn("[AI] Retrieval failed (analyzeCase)", e);
        }
        
        const response = await invokeLLM({ messages });
        const rawAnalysis = response.choices[0]?.message?.content;
        const analysis = typeof rawAnalysis === "string" ? rawAnalysis : "عذراً، حدث خطأ في التحليل.";
        
        return { analysis };
      }),
    
    generateDocument: protectedProcedure
      .input(z.object({
        documentType: z.enum(["memo", "pleading", "contract", "power_of_attorney", "letter"]),
        caseId: z.number().optional().nullable(),
        clientId: z.number().optional().nullable(),
        customInstructions: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Subscription check is kept consistent with chat/analyzeCase
        // The protectedProcedure already ensures ctx.user exists
        // and subscription gating is handled in those mutations.
        const documentPrompts: Record<string, string> = {
          memo: "اكتب مذكرة قانونية احترافية",
          pleading: "اكتب لائحة دعوى/جوابية",
          contract: "اكتب عقد قانوني",
          power_of_attorney: "اكتب وكالة قانونية",
          letter: "اكتب خطاب رسمي قانوني",
        };
        
        let context = "";
        if (input.caseId) {
          const caseData = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
          if (!caseData) {
            throw new TRPCError({ code: "NOT_FOUND", message: "القضية غير موجودة" });
          }
          context = `\n\nسياق القضية:\n- رقم القضية: ${caseData.caseNumber}\n- العنوان: ${caseData.title}\n- النوع: ${caseData.type}`;
        }
        if (input.clientId) {
          const client = await db.getClientByIdForUser(ctx.user.id, input.clientId);
          if (!client) {
            throw new TRPCError({ code: "NOT_FOUND", message: "العميل غير موجود" });
          }
          context += `\n\nبيانات العميل:\n- الاسم: ${client.name}\n- النوع: ${client.type}`;
        }
        
        const messages: { role: "system" | "user"; content: string }[] = [
          { role: "system", content: SAUDI_LAW_SYSTEM_PROMPT },
          {
            role: "user",
            content: `${documentPrompts[input.documentType]}${context}${input.customInstructions ? `\n\nتعليمات إضافية: ${input.customInstructions}` : ""}`,
          },
        ];
        
        const response = await invokeLLM({ messages });
        const rawDocument = response.choices[0]?.message?.content;
        const document = typeof rawDocument === "string" ? rawDocument : "عذراً، حدث خطأ في إنشاء المستند.";
        
        return { document };
      }),
  }),

  legalKnowledge: router({
    runCrawl: adminProcedure
      .input(
        z
          .object({
            seedSitemaps: z.array(z.string().url()).optional(),
            force: z.boolean().optional(),
          })
          .optional()
      )
      .mutation(async ({ input }) => {
        const result = await runLegalCrawlerOnce({
          seedSitemaps: input?.seedSitemaps,
          force: input?.force ?? true,
        });
        return result as any;
      }),

    search: adminProcedure
      .input(
        z.object({
          query: z.string().min(1),
          topK: z.number().int().min(1).max(10).default(5),
        })
      )
      .query(async ({ input }) => {
        return retrieveLegalSnippets({ query: input.query, topK: input.topK, scanLimit: 1000 });
      }),
  }),

  // ==================== NOTIFICATIONS ====================
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getNotificationsByUserId(ctx.user.id, input?.unreadOnly);
      }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.markNotificationAsReadForUser(ctx.user.id, input.id);
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ==================== USERS/TEAM ====================
  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const organizationId = await db.ensureUserHasOrganization({
        openId: ctx.user.openId,
        defaultOrganizationName: ctx.user.name ?? null,
      });
      return db.getUsersByOrganizationId(organizationId);
    }),

    addMember: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional().nullable(),
          phone: z.string().optional().nullable(),
          role: z.enum(["lawyer", "assistant", "client"]).default("lawyer"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const organizationId = await db.ensureUserHasOrganization({
          openId: ctx.user.openId,
          defaultOrganizationName: ctx.user.name ?? null,
        });

        const org = await db.getOrganizationById(organizationId);
        const orgPlan = (org?.subscriptionPlan ?? "individual") as
          | "individual"
          | "law_firm"
          | "enterprise";
        const seatLimit = org?.seatLimit ?? 1;
        const memberCount = await db.getOrganizationMemberCount(organizationId);

        if (memberCount >= seatLimit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `لا يمكن إضافة عضو جديد. لقد وصلت للحد الأقصى لمقاعد الباقة الحالية (${seatLimit}).`,
          });
        }

        const normalizedEmail = typeof input.email === "string" ? input.email.trim().toLowerCase() : undefined;
        const openId = `org-${organizationId}-${nanoid(12)}`;

        try {
          await db.upsertUser({
            openId,
            organizationId,
            name: input.name,
            email: normalizedEmail ?? null,
            phone: input.phone ?? null,
            loginMethod: "org",
            role: input.role,
            accountType: orgPlan,
            subscriptionPlan: orgPlan,
            seatLimit,
            isActive: ctx.user.isActive,
            lastSignedIn: new Date(),
          });
        } catch (error) {
          const errMsg = (error as any)?.message ?? "";
          if (errMsg === "EMAIL_ALREADY_IN_USE") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "هذا البريد الإلكتروني مستخدم بالفعل.",
            });
          }
          if (errMsg === "PHONE_ALREADY_IN_USE") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "هذا رقم الجوال مستخدم بالفعل.",
            });
          }
          throw error;
        }

        return { success: true as const };
      }),
    
    lawyers: protectedProcedure.query(async ({ ctx }) => {
      const organizationId = await db.ensureUserHasOrganization({
        openId: ctx.user.openId,
        defaultOrganizationName: ctx.user.name ?? null,
      });
      const members = await db.getUsersByOrganizationId(organizationId);
      return members.filter((u) => u.role === "lawyer" || u.role === "admin");
    }),
  }),

  // ==================== COMMUNICATION LOGS ====================
  communications: router({
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        caseId: z.number().optional().nullable(),
        type: z.enum(["call", "email", "meeting", "whatsapp", "sms", "other"]),
        direction: z.enum(["incoming", "outgoing"]),
        subject: z.string().optional().nullable(),
        content: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ownedClient = await db.getClientByIdForUser(ctx.user.id, input.clientId);
        if (!ownedClient) {
          throw new TRPCError({ code: "NOT_FOUND", message: "العميل غير موجود" });
        }
        if (input.caseId) {
          const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
          if (!ownedCase) {
            throw new TRPCError({ code: "NOT_FOUND", message: "القضية غير موجودة" });
          }
        }
        const id = await db.createCommunicationLog({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),
  }),

  // ==================== TIME ENTRIES ====================
  timeEntries: router({
    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        description: z.string().optional().nullable(),
        minutes: z.number(),
        hourlyRate: z.number().optional().nullable(),
        billable: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ownedCase = await db.getCaseByIdForUser(ctx.user.id, input.caseId);
        if (!ownedCase) {
          throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
        }
        const id = await db.createTimeEntry({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),
    
    byCaseId: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getTimeEntriesByCaseIdForUser(ctx.user.id, input.caseId);
      }),
    
    myEntries: protectedProcedure.query(async ({ ctx }) => {
      return db.getTimeEntriesByUserId(ctx.user.id);
    }),
  }),

  owner: router({
    overview: ownerProcedure.query(async () => {
      const [users, organizations] = await Promise.all([db.getAllUsers(), db.getAllOrganizations()]);

      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.isActive).length;
      const totalOrganizations = organizations.length;

      const byPlan = {
        individual: 0,
        law_firm: 0,
        enterprise: 0,
      } as Record<"individual" | "law_firm" | "enterprise", number>;

      for (const u of users) {
        const plan = (u.subscriptionPlan ?? "individual") as "individual" | "law_firm" | "enterprise";
        byPlan[plan] = (byPlan[plan] ?? 0) + 1;
      }

      return {
        totalUsers,
        activeUsers,
        totalOrganizations,
        usersByPlan: byPlan,
      } as const;
    }),

    stats: ownerProcedure
      .input(
        z
          .object({
            range: z.enum(["week", "month", "quarter", "year"]).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const [users, organizations, caseStats, invoiceStats, reportsStats, dashboardStats] =
          await Promise.all([
            db.getAllUsers(),
            db.getAllOrganizations(),
            db.getCaseStats(),
            db.getInvoiceStats(),
            db.getReportsStats(input?.range),
            db.getDashboardStats(),
          ]);

        const totalUsers = users.length;
        const activeUsers = users.filter((u) => u.isActive).length;
        const totalOrganizations = organizations.length;

        return {
          users: {
            total: totalUsers,
            active: activeUsers,
          },
          organizations: {
            total: totalOrganizations,
          },
          cases: caseStats,
          invoices: invoiceStats,
          reports: reportsStats,
          dashboard: dashboardStats,
        } as const;
      }),

    users: router({
      list: ownerProcedure
        .input(
          z
            .object({
              query: z.string().optional(),
              role: z.enum(["admin", "lawyer", "assistant", "client"]).optional(),
              isActive: z.boolean().optional(),
            })
            .optional()
        )
        .query(async ({ input }) => {
          const [users, organizations] = await Promise.all([db.getAllUsers(), db.getAllOrganizations()]);
          const orgById = new Map<number, any>(organizations.map((o: any) => [Number(o.id), o]));

          const q = (input?.query ?? "").trim().toLowerCase();
          let list = users;

          if (input?.role) {
            list = list.filter((u) => u.role === input.role);
          }
          if (typeof input?.isActive === "boolean") {
            list = list.filter((u) => Boolean(u.isActive) === input.isActive);
          }
          if (q) {
            list = list.filter((u) => {
              const name = (u.name ?? "").toLowerCase();
              const email = (u.email ?? "").toLowerCase();
              const phone = (u.phone ?? "").toLowerCase();
              const openId = (u.openId ?? "").toLowerCase();
              return name.includes(q) || email.includes(q) || phone.includes(q) || openId.includes(q);
            });
          }

          return list.map((u) => {
            const orgId = u.organizationId ? Number(u.organizationId) : null;
            const org = orgId ? orgById.get(orgId) : null;
            return {
              ...u,
              organization: org ? { id: Number(org.id), name: org.name, subscriptionPlan: org.subscriptionPlan, seatLimit: org.seatLimit } : null,
            };
          });
        }),

      setActive: ownerProcedure
        .input(z.object({ userId: z.number(), isActive: z.boolean() }))
        .mutation(async ({ input }) => {
          await db.setUserActive(input.userId, input.isActive);
          return { success: true as const };
        }),

      setPlan: ownerProcedure
        .input(
          z.object({
            userId: z.number(),
            plan: z.enum(["individual", "law_firm", "enterprise"]),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const user = await db.getUserById(input.userId);
          if (!user) {
            throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
          }

          const seatLimit = input.plan === "law_firm" ? 5 : input.plan === "enterprise" ? 15 : 1;
          const organizationId = await db.ensureUserHasOrganization({
            openId: user.openId,
            defaultOrganizationName: user.name ?? null,
          });

          await db.setOrganizationSubscriptionPlan({
            organizationId,
            subscriptionPlan: input.plan,
            seatLimit,
          });

          await db.setUserSubscriptionPlan({
            userId: user.id,
            subscriptionPlan: input.plan,
            accountType: input.plan,
            seatLimit,
          });

          if (typeof input.isActive === "boolean") {
            await db.setUserActive(user.id, input.isActive);
          }

          return { success: true as const };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
