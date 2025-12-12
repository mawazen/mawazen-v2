import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "lawyer", "assistant", "client"]).default("lawyer").notNull(),
  avatarUrl: text("avatarUrl"),
  specialty: varchar("specialty", { length: 255 }),
  barNumber: varchar("barNumber", { length: 100 }),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== CLIENTS ====================
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }),
  type: mysqlEnum("type", ["individual", "company", "government"]).default("individual").notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  secondaryPhone: varchar("secondaryPhone", { length: 20 }),
  nationalId: varchar("nationalId", { length: 20 }),
  commercialRegister: varchar("commercialRegister", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  notes: text("notes"),
  satisfactionScore: int("satisfactionScore").default(0),
  totalPaid: bigint("totalPaid", { mode: "number" }).default(0),
  totalDue: bigint("totalDue", { mode: "number" }).default(0),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ==================== CASES ====================
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["criminal", "commercial", "family", "administrative", "labor", "real_estate", "other"]).default("other").notNull(),
  court: varchar("court", { length: 255 }),
  courtBranch: varchar("courtBranch", { length: 255 }),
  stage: mysqlEnum("stage", ["intake", "filing", "discovery", "hearing", "judgment", "appeal", "execution", "closed"]).default("intake").notNull(),
  status: mysqlEnum("status", ["active", "pending", "on_hold", "won", "lost", "settled", "closed"]).default("active").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  clientId: int("clientId").notNull(),
  assignedLawyerId: int("assignedLawyerId"),
  opposingParty: varchar("opposingParty", { length: 500 }),
  opposingLawyer: varchar("opposingLawyer", { length: 255 }),
  filingDate: timestamp("filingDate"),
  nextHearingDate: timestamp("nextHearingDate"),
  closingDate: timestamp("closingDate"),
  estimatedValue: bigint("estimatedValue", { mode: "number" }),
  actualValue: bigint("actualValue", { mode: "number" }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

// ==================== HEARINGS ====================
export const hearings = mysqlTable("hearings", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  hearingDate: timestamp("hearingDate").notNull(),
  location: varchar("location", { length: 255 }),
  courtRoom: varchar("courtRoom", { length: 100 }),
  status: mysqlEnum("status", ["scheduled", "completed", "postponed", "cancelled"]).default("scheduled").notNull(),
  outcome: text("outcome"),
  notes: text("notes"),
  reminderSent: boolean("reminderSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hearing = typeof hearings.$inferSelect;
export type InsertHearing = typeof hearings.$inferInsert;

// ==================== DOCUMENTS ====================
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["contract", "memo", "pleading", "evidence", "correspondence", "court_order", "power_of_attorney", "other"]).default("other").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: bigint("fileSize", { mode: "number" }),
  caseId: int("caseId"),
  clientId: int("clientId"),
  version: int("version").default(1),
  parentDocumentId: int("parentDocumentId"),
  isTemplate: boolean("isTemplate").default(false),
  uploadedById: int("uploadedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ==================== TASKS ====================
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  caseId: int("caseId"),
  assignedToId: int("assignedToId"),
  assignedById: int("assignedById"),
  dueDate: timestamp("dueDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ==================== INVOICES ====================
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  caseId: int("caseId"),
  amount: bigint("amount", { mode: "number" }).notNull(),
  taxAmount: bigint("taxAmount", { mode: "number" }).default(0),
  totalAmount: bigint("totalAmount", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "partial", "overdue", "cancelled"]).default("draft").notNull(),
  feeType: mysqlEnum("feeType", ["hourly", "fixed", "percentage", "retainer"]).default("fixed").notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  paidAmount: bigint("paidAmount", { mode: "number" }).default(0),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ==================== PAYMENTS ====================
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR").notNull(),
  method: mysqlEnum("method", ["cash", "bank_transfer", "credit_card", "stc_pay", "stripe", "other"]).default("bank_transfer").notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  notes: text("notes"),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==================== CALENDAR EVENTS ====================
export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: mysqlEnum("eventType", ["hearing", "meeting", "deadline", "reminder", "other"]).default("other").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  allDay: boolean("allDay").default(false),
  location: varchar("location", { length: 255 }),
  caseId: int("caseId"),
  userId: int("userId"),
  reminderMinutes: int("reminderMinutes").default(60),
  isRecurring: boolean("isRecurring").default(false),
  recurrenceRule: varchar("recurrenceRule", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// ==================== COMMUNICATION LOGS ====================
export const communicationLogs = mysqlTable("communicationLogs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  caseId: int("caseId"),
  userId: int("userId"),
  type: mysqlEnum("type", ["call", "email", "meeting", "whatsapp", "sms", "other"]).default("other").notNull(),
  direction: mysqlEnum("direction", ["incoming", "outgoing"]).default("outgoing").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  contactedAt: timestamp("contactedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = typeof communicationLogs.$inferInsert;

// ==================== AI CHAT HISTORY ====================
export const aiChatHistory = mysqlTable("aiChatHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId"),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiChatHistory = typeof aiChatHistory.$inferSelect;
export type InsertAiChatHistory = typeof aiChatHistory.$inferInsert;

// ==================== NOTIFICATIONS ====================
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["hearing", "deadline", "payment", "task", "system"]).default("system").notNull(),
  isRead: boolean("isRead").default(false),
  relatedCaseId: int("relatedCaseId"),
  relatedInvoiceId: int("relatedInvoiceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ==================== TIME ENTRIES (for hourly billing) ====================
export const timeEntries = mysqlTable("timeEntries", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  description: text("description"),
  minutes: int("minutes").notNull(),
  hourlyRate: bigint("hourlyRate", { mode: "number" }),
  billable: boolean("billable").default(true),
  invoiceId: int("invoiceId"),
  entryDate: timestamp("entryDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;
