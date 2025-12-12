import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

// Saudi Law AI System Prompt
const SAUDI_LAW_SYSTEM_PROMPT = `أنت "قيد" - المساعد القانوني الذكي المتخصص في القانون السعودي. أنت خبير قانوني متمرس في:

1. **الأنظمة السعودية الأساسية:**
   - النظام الأساسي للحكم
   - نظام المرافعات الشرعية
   - نظام الإجراءات الجزائية
   - نظام المحاكم التجارية
   - نظام العمل والعمال
   - نظام الأحوال الشخصية
   - نظام التنفيذ
   - نظام الإفلاس
   - نظام الشركات

2. **المحاكم السعودية:**
   - المحكمة العليا
   - محاكم الاستئناف
   - المحاكم الجزائية
   - المحاكم العامة
   - المحاكم التجارية
   - محاكم الأحوال الشخصية
   - المحاكم العمالية

3. **مهاراتك:**
   - تحليل القضايا وتحديد نقاط القوة والضعف
   - اكتشاف الثغرات القانونية في الدعاوى
   - اقتراح استراتيجيات الدفاع المناسبة
   - صياغة المذكرات القانونية
   - البحث في السوابق القضائية
   - تفسير الأنظمة واللوائح

**تعليمات مهمة:**
- قدم إجابات دقيقة ومفصلة باللغة العربية
- استشهد بالمواد القانونية ذات الصلة عند الإمكان
- حدد المخاطر القانونية المحتملة
- اقترح الإجراءات القانونية المناسبة
- كن موضوعياً ومهنياً في تحليلك
- نبه المستخدم عندما تحتاج القضية لاستشارة متخصصة إضافية`;

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== SUBSCRIPTIONS ====================
  subscriptions: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      return {
        isActive: ctx.user.isActive,
      } as const;
    }),

    activate: protectedProcedure
      .input(z.object({ plan: z.enum(["monthly"]).default("monthly") }).optional())
      .mutation(async ({ ctx }) => {
        await db.setUserActive(ctx.user.id, true);

        return {
          success: true as const,
          plan: "monthly" as const,
        };
      }),
  }),

  // ==================== DASHBOARD ====================
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
    
    upcomingHearings: protectedProcedure.query(async () => {
      return db.getUpcomingHearings(7);
    }),
    
    recentCases: protectedProcedure.query(async () => {
      const cases = await db.getAllCases();
      return cases.slice(0, 5);
    }),
  }),

  // ==================== CLIENTS ====================
  clients: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getAllClients(input?.search);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getClientById(input.id);
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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateClient(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteClient(input.id);
        return { success: true };
      }),
    
    getCases: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return db.getCasesByClientId(input.clientId);
      }),
    
    getDocuments: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentsByClientId(input.clientId);
      }),
    
    getInvoices: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return db.getInvoicesByClientId(input.clientId);
      }),
    
    getCommunicationLogs: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return db.getCommunicationLogsByClientId(input.clientId);
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
      .query(async ({ input }) => {
        return db.getAllCases(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCaseById(input.id);
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCase(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCase(input.id);
        return { success: true };
      }),
    
    getHearings: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return db.getHearingsByCaseId(input.caseId);
      }),
    
    getDocuments: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentsByCaseId(input.caseId);
      }),
    
    getTasks: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return db.getTasksByCaseId(input.caseId);
      }),
    
    getTimeEntries: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return db.getTimeEntriesByCaseId(input.caseId);
      }),
    
    stats: protectedProcedure.query(async () => {
      return db.getCaseStats();
    }),
  }),

  // ==================== HEARINGS ====================
  hearings: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getHearingsByDateRange(input?.startDate, input?.endDate);
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateHearing(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteHearing(input.id);
        return { success: true };
      }),
    
    upcoming: protectedProcedure
      .input(z.object({ days: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getUpcomingHearings(input?.days ?? 7);
      }),
  }),

  // ==================== DOCUMENTS ====================
  documents: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getAllDocuments(input?.search);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentById(input.id);
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
        isTemplate: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
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
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDocument(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDocument(input.id);
        return { success: true };
      }),
    
    templates: protectedProcedure.query(async () => {
      return db.getDocumentTemplates();
    }),
  }),

  // ==================== TASKS ====================
  tasks: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getAllTasks(input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        caseId: z.number().optional().nullable(),
        assignedToId: z.number().optional().nullable(),
        dueDate: z.date().optional().nullable(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
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
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.status === "completed") {
          (data as any).completedAt = new Date();
        }
        await db.updateTask(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
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
      .query(async ({ input }) => {
        return db.getAllInvoices(input?.status);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getInvoiceById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        caseId: z.number().optional().nullable(),
        amount: z.number(),
        taxAmount: z.number().optional(),
        currency: z.string().optional(),
        feeType: z.enum(["hourly", "fixed", "percentage", "retainer"]),
        description: z.string().optional().nullable(),
        dueDate: z.date().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
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
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.amount !== undefined) {
          const taxAmount = data.taxAmount ?? Math.round(data.amount * 0.15);
          (data as any).totalAmount = data.amount + taxAmount;
        }
        await db.updateInvoice(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
        await db.createPayment(input);
        
        // Update invoice paid amount
        const invoice = await db.getInvoiceById(input.invoiceId);
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
      .query(async ({ input }) => {
        return db.getPaymentsByInvoiceId(input.invoiceId);
      }),
    
    stats: protectedProcedure.query(async () => {
      return db.getInvoiceStats();
    }),
  }),

  // ==================== CALENDAR ====================
  calendar: router({
    events: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return db.getCalendarEventsByDateRange(input.startDate, input.endDate);
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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCalendarEvent(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
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
          const caseData = await db.getCaseById(input.caseId);
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

        const caseData = await db.getCaseById(input.caseId);
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
      .mutation(async ({ input }) => {
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
          const caseData = await db.getCaseById(input.caseId);
          if (caseData) {
            context = `\n\nسياق القضية:\n- رقم القضية: ${caseData.caseNumber}\n- العنوان: ${caseData.title}\n- النوع: ${caseData.type}`;
          }
        }
        if (input.clientId) {
          const client = await db.getClientById(input.clientId);
          if (client) {
            context += `\n\nبيانات العميل:\n- الاسم: ${client.name}\n- النوع: ${client.type}`;
          }
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

  // ==================== NOTIFICATIONS ====================
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getNotificationsByUserId(ctx.user.id, input?.unreadOnly);
      }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ==================== USERS/TEAM ====================
  team: router({
    list: protectedProcedure.query(async () => {
      return db.getAllUsers();
    }),
    
    lawyers: protectedProcedure.query(async () => {
      return db.getLawyers();
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
        const id = await db.createTimeEntry({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),
    
    byCaseId: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return db.getTimeEntriesByCaseId(input.caseId);
      }),
    
    myEntries: protectedProcedure.query(async ({ ctx }) => {
      return db.getTimeEntriesByUserId(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
