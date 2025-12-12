import { eq, desc, and, like, or, sql, gte, lte, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  clients,
  cases,
  hearings,
  documents,
  tasks,
  invoices,
  payments,
  calendarEvents,
  communicationLogs,
  aiChatHistory,
  notifications,
  timeEntries,
  InsertClient,
  InsertCase,
  InsertHearing,
  InsertDocument,
  InsertTask,
  InsertInvoice,
  InsertPayment,
  InsertCalendarEvent,
  InsertCommunicationLog,
  InsertAiChatHistory,
  InsertNotification,
  InsertTimeEntry,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// In-memory user storage for local development
const inMemoryUsers = new Map<string, any>();

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER FUNCTIONS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using in-memory storage for user:", user.openId);
    // Use in-memory storage for local development
    const existingUser = inMemoryUsers.get(user.openId);
    const updatedUser = {
      ...existingUser,
      ...user,
      id: existingUser?.id || Date.now(),
      createdAt: existingUser?.createdAt || new Date(),
      lastSignedIn: user.lastSignedIn || new Date(),
    };
    inMemoryUsers.set(user.openId, updatedUser);
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "avatarUrl", "specialty", "barNumber"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    // By default، يتم إنشاء المستخدمين الجدد بدون اشتراك فعّال
    // لا نضيف isActive إلى updateSet إلا إذا تم تمريره صراحةً
    if (user.isActive !== undefined) {
      values.isActive = user.isActive;
      updateSet.isActive = user.isActive;
    } else {
      values.isActive = false;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using in-memory storage for user lookup:", openId);
    return inMemoryUsers.get(openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function setUserActive(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

export async function getLawyers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(or(eq(users.role, "lawyer"), eq(users.role, "admin")));
}

// ==================== CLIENT FUNCTIONS ====================
export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(client);
  return result[0].insertId;
}

export async function updateClient(id: number, client: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(client).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function getAllClients(search?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (search) {
    return db.select().from(clients)
      .where(or(
        like(clients.name, `%${search}%`),
        like(clients.email, `%${search}%`),
        like(clients.phone, `%${search}%`)
      ))
      .orderBy(desc(clients.createdAt));
  }
  
  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(clients);
  return result[0]?.count ?? 0;
}

// ==================== CASE FUNCTIONS ====================
export async function createCase(caseData: InsertCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cases).values(caseData);
  return result[0].insertId;
}

export async function updateCase(id: number, caseData: Partial<InsertCase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cases).set(caseData).where(eq(cases.id, id));
}

export async function deleteCase(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cases).where(eq(cases.id, id));
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result[0];
}

export async function getAllCases(filters?: { status?: string; type?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(cases);
  const conditions = [];
  
  if (filters?.status) {
    conditions.push(eq(cases.status, filters.status as any));
  }
  if (filters?.type) {
    conditions.push(eq(cases.type, filters.type as any));
  }
  if (filters?.search) {
    conditions.push(or(
      like(cases.caseNumber, `%${filters.search}%`),
      like(cases.title, `%${filters.search}%`)
    ));
  }
  
  if (conditions.length > 0) {
    return db.select().from(cases).where(and(...conditions)).orderBy(desc(cases.createdAt));
  }
  
  return db.select().from(cases).orderBy(desc(cases.createdAt));
}

export async function getCasesByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cases).where(eq(cases.clientId, clientId)).orderBy(desc(cases.createdAt));
}

export async function getCaseStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, won: 0, lost: 0, pending: 0 };
  
  const total = await db.select({ count: count() }).from(cases);
  const active = await db.select({ count: count() }).from(cases).where(eq(cases.status, "active"));
  const won = await db.select({ count: count() }).from(cases).where(eq(cases.status, "won"));
  const lost = await db.select({ count: count() }).from(cases).where(eq(cases.status, "lost"));
  const pending = await db.select({ count: count() }).from(cases).where(eq(cases.status, "pending"));
  
  return {
    total: total[0]?.count ?? 0,
    active: active[0]?.count ?? 0,
    won: won[0]?.count ?? 0,
    lost: lost[0]?.count ?? 0,
    pending: pending[0]?.count ?? 0,
  };
}

// ==================== HEARING FUNCTIONS ====================
export async function createHearing(hearing: InsertHearing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(hearings).values(hearing);
  return result[0].insertId;
}

export async function updateHearing(id: number, hearing: Partial<InsertHearing>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(hearings).set(hearing).where(eq(hearings.id, id));
}

export async function deleteHearing(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(hearings).where(eq(hearings.id, id));
}

export async function getHearingsByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hearings).where(eq(hearings.caseId, caseId)).orderBy(desc(hearings.hearingDate));
}

export async function getUpcomingHearings(days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return db.select().from(hearings)
    .where(and(
      gte(hearings.hearingDate, now),
      lte(hearings.hearingDate, future),
      eq(hearings.status, "scheduled")
    ))
    .orderBy(hearings.hearingDate);
}

export async function getHearingsByDateRange(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (startDate) {
    conditions.push(gte(hearings.hearingDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(hearings.hearingDate, endDate));
  }
  
  if (conditions.length === 0) {
    return db.select().from(hearings).orderBy(hearings.hearingDate);
  }
  
  return db.select().from(hearings)
    .where(and(...conditions))
    .orderBy(hearings.hearingDate);
}

// ==================== DOCUMENT FUNCTIONS ====================
export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(doc);
  return result[0].insertId;
}

export async function updateDocument(id: number, doc: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documents).set(doc).where(eq(documents.id, id));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documents).where(eq(documents.id, id));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
}

export async function getDocumentsByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.caseId, caseId)).orderBy(desc(documents.createdAt));
}

export async function getDocumentsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.clientId, clientId)).orderBy(desc(documents.createdAt));
}

export async function getDocumentTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.isTemplate, true)).orderBy(desc(documents.createdAt));
}

export async function getAllDocuments(search?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (search) {
    return db.select().from(documents)
      .where(like(documents.name, `%${search}%`))
      .orderBy(desc(documents.createdAt));
  }
  
  return db.select().from(documents).orderBy(desc(documents.createdAt));
}

// ==================== TASK FUNCTIONS ====================
export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(task);
  return result[0].insertId;
}

export async function updateTask(id: number, task: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(task).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function getTasksByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.assignedToId, userId)).orderBy(desc(tasks.createdAt));
}

export async function getTasksByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.caseId, caseId)).orderBy(desc(tasks.createdAt));
}

export async function getAllTasks(filters?: { status?: string; priority?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(tasks.status, filters.status as any));
  }
  if (filters?.priority) {
    conditions.push(eq(tasks.priority, filters.priority as any));
  }
  
  if (conditions.length > 0) {
    return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
  }
  
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

// ==================== INVOICE FUNCTIONS ====================
export async function createInvoice(invoice: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invoices).values(invoice);
  return result[0].insertId;
}

export async function updateInvoice(id: number, invoice: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(invoices).set(invoice).where(eq(invoices.id, id));
}

export async function deleteInvoice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(invoices).where(eq(invoices.id, id));
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}

export async function getInvoicesByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt));
}

export async function getAllInvoices(status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return db.select().from(invoices).where(eq(invoices.status, status as any)).orderBy(desc(invoices.createdAt));
  }
  
  return db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceStats() {
  const db = await getDb();
  if (!db) return { total: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0, paidAmount: 0 };
  
  const allInvoices = await db.select().from(invoices);
  
  let total = 0, paid = 0, pending = 0, overdue = 0, totalAmount = 0, paidAmount = 0;
  
  allInvoices.forEach(inv => {
    total++;
    totalAmount += inv.totalAmount ?? 0;
    if (inv.status === "paid") {
      paid++;
      paidAmount += inv.paidAmount ?? 0;
    } else if (inv.status === "overdue") {
      overdue++;
    } else if (inv.status === "sent" || inv.status === "partial") {
      pending++;
    }
  });
  
  return { total, paid, pending, overdue, totalAmount, paidAmount };
}

// ==================== PAYMENT FUNCTIONS ====================
export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(payment);
  return result[0].insertId;
}

export async function getPaymentsByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(desc(payments.paidAt));
}

// ==================== CALENDAR EVENT FUNCTIONS ====================
export async function createCalendarEvent(event: InsertCalendarEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(calendarEvents).values(event);
  return result[0].insertId;
}

export async function updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(calendarEvents).set(event).where(eq(calendarEvents.id, id));
}

export async function deleteCalendarEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}

export async function getCalendarEventsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(calendarEvents.startTime);
}

export async function getCalendarEventsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents)
    .where(and(
      gte(calendarEvents.startTime, startDate),
      lte(calendarEvents.startTime, endDate)
    ))
    .orderBy(calendarEvents.startTime);
}

// ==================== COMMUNICATION LOG FUNCTIONS ====================
export async function createCommunicationLog(log: InsertCommunicationLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(communicationLogs).values(log);
  return result[0].insertId;
}

export async function getCommunicationLogsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communicationLogs).where(eq(communicationLogs.clientId, clientId)).orderBy(desc(communicationLogs.contactedAt));
}

// ==================== AI CHAT HISTORY FUNCTIONS ====================
export async function createAiChatMessage(message: InsertAiChatHistory) {
  const db = await getDb();
  if (!db) {
    console.log("[DB] Using in-memory storage for AI chat message");
    // Use in-memory storage for local development
    const inMemoryMessages = globalThis.aiChatMessages || (globalThis.aiChatMessages = []);
    const newMessage = {
      ...message,
      id: Date.now(),
      createdAt: new Date(),
    };
    inMemoryMessages.push(newMessage);
    console.log("[DB] AI chat message created successfully in memory");
    return newMessage.id;
  }
  console.log("[DB] Creating AI chat message for user:", message.userId);
  const result = await db.insert(aiChatHistory).values(message);
  console.log("[DB] AI chat message created successfully");
  return result[0].insertId;
}

export async function getAiChatHistory(userId: number, sessionId: string) {
  const db = await getDb();
  if (!db) {
    console.log("[DB] Using in-memory storage for AI chat history");
    // Use in-memory storage for local development
    const inMemoryMessages = globalThis.aiChatMessages || [];
    return inMemoryMessages.filter(msg => 
      msg.userId === userId && msg.sessionId === sessionId
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  return db.select().from(aiChatHistory)
    .where(and(
      eq(aiChatHistory.userId, userId),
      eq(aiChatHistory.sessionId, sessionId)
    ))
    .orderBy(aiChatHistory.createdAt);
}

export async function getAiChatSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ sessionId: aiChatHistory.sessionId, createdAt: aiChatHistory.createdAt })
    .from(aiChatHistory)
    .where(eq(aiChatHistory.userId, userId))
    .groupBy(aiChatHistory.sessionId)
    .orderBy(desc(aiChatHistory.createdAt));
}

// ==================== NOTIFICATION FUNCTIONS ====================
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return result[0].insertId;
}

export async function getNotificationsByUserId(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  if (unreadOnly) {
    return db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt));
  }
  
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ==================== TIME ENTRY FUNCTIONS ====================
export async function createTimeEntry(entry: InsertTimeEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timeEntries).values(entry);
  return result[0].insertId;
}

export async function getTimeEntriesByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeEntries).where(eq(timeEntries.caseId, caseId)).orderBy(desc(timeEntries.entryDate));
}

export async function getTimeEntriesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeEntries).where(eq(timeEntries.userId, userId)).orderBy(desc(timeEntries.entryDate));
}

// ==================== DASHBOARD STATS ====================
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return {
    totalCases: 0,
    activeCases: 0,
    totalClients: 0,
    upcomingHearings: 0,
    pendingTasks: 0,
    unpaidInvoices: 0,
    winRate: 0,
    totalRevenue: 0,
  };
  
  const caseStats = await getCaseStats();
  const clientCount = await getClientCount();
  const upcoming = await getUpcomingHearings(7);
  const pendingTasksResult = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, "pending"));
  const invoiceStats = await getInvoiceStats();
  
  const winRate = caseStats.total > 0 
    ? Math.round((caseStats.won / (caseStats.won + caseStats.lost || 1)) * 100) 
    : 0;
  
  return {
    totalCases: caseStats.total,
    activeCases: caseStats.active,
    totalClients: clientCount,
    upcomingHearings: upcoming.length,
    pendingTasks: pendingTasksResult[0]?.count ?? 0,
    unpaidInvoices: invoiceStats.pending + invoiceStats.overdue,
    winRate,
    totalRevenue: invoiceStats.paidAmount,
  };
}
