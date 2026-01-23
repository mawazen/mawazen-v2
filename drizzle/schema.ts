import { int, mysqlEnum, mysqlTable, text, longtext, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

// ==================== ORGANIZATIONS ====================
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["individual", "law_firm", "enterprise"]).default("individual").notNull(),
  seatLimit: int("seatLimit").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  organizationId: int("organizationId"),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "lawyer", "assistant", "client"]).default("lawyer").notNull(),
  accountType: mysqlEnum("accountType", ["individual", "law_firm", "enterprise"]).default("individual").notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["individual", "law_firm", "enterprise"]).default("individual").notNull(),
  seatLimit: int("seatLimit").default(1).notNull(),
  avatarUrl: text("avatarUrl"),
  specialty: varchar("specialty", { length: 255 }),
  barNumber: varchar("barNumber", { length: 100 }),
  referralCode: varchar("referralCode", { length: 24 }),
  subscriptionEndsAt: timestamp("subscriptionEndsAt"),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const appSettings = mysqlTable("appSettings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;
export const referralRedemptions = mysqlTable("referralRedemptions", {
  id: int("id").autoincrement().primaryKey(),
  referrerUserId: int("referrerUserId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  paymentId: varchar("paymentId", { length: 128 }).notNull().unique(),
  referralCode: varchar("referralCode", { length: 24 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralRedemption = typeof referralRedemptions.$inferSelect;
export type InsertReferralRedemption = typeof referralRedemptions.$inferInsert;
export const promoRedemptions = mysqlTable("promoRedemptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  paymentId: varchar("paymentId", { length: 128 }).notNull().unique(),
  promoCode: varchar("promoCode", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromoRedemption = typeof promoRedemptions.$inferSelect;
export type InsertPromoRedemption = typeof promoRedemptions.$inferInsert;

export const subscriptionPayments = mysqlTable("subscriptionPayments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  paymentId: varchar("paymentId", { length: 128 }).notNull().unique(),
  plan: mysqlEnum("plan", ["individual", "law_firm", "enterprise"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type InsertSubscriptionPayment = typeof subscriptionPayments.$inferInsert;

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
  portalToken: varchar("portalToken", { length: 64 }),
  portalEnabled: boolean("portalEnabled").default(false).notNull(),
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
  serviceProjectId: int("serviceProjectId"),
  version: int("version").default(1),
  parentDocumentId: int("parentDocumentId"),
  isTemplate: boolean("isTemplate").default(false),
  isSharedWithClient: boolean("isSharedWithClient").default(false).notNull(),
  templateCategory: varchar("templateCategory", { length: 100 }),
  expiresAt: timestamp("expiresAt"),
  renewAt: timestamp("renewAt"),
  reminderDays: int("reminderDays").default(30),
  lastReminderSentAt: timestamp("lastReminderSentAt"),
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
  serviceProjectId: int("serviceProjectId"),
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
  serviceProjectId: int("serviceProjectId"),
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

// ==================== SERVICE PROJECTS (Legal Services Workflow) ====================
export const serviceProjects = mysqlTable("serviceProjects", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  serviceCatalogId: int("serviceCatalogId"),
  clientId: int("clientId"),
  caseId: int("caseId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["new", "in_progress", "on_hold", "completed", "cancelled"]).default("new").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  assignedToUserId: int("assignedToUserId"),
  createdByUserId: int("createdByUserId"),
  startDate: timestamp("startDate"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceProject = typeof serviceProjects.$inferSelect;
export type InsertServiceProject = typeof serviceProjects.$inferInsert;

export const serviceProjectExpenses = mysqlTable("serviceProjectExpenses", {
  id: int("id").autoincrement().primaryKey(),
  serviceProjectId: int("serviceProjectId").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR").notNull(),
  description: text("description"),
  expenseDate: timestamp("expenseDate").defaultNow().notNull(),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServiceProjectExpense = typeof serviceProjectExpenses.$inferSelect;
export type InsertServiceProjectExpense = typeof serviceProjectExpenses.$inferInsert;

export const serviceCatalog = mysqlTable("serviceCatalog", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  durationMinutes: int("durationMinutes").default(60).notNull(),
  priceAmount: bigint("priceAmount", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceCatalogItem = typeof serviceCatalog.$inferSelect;
export type InsertServiceCatalogItem = typeof serviceCatalog.$inferInsert;

export const serviceRequests = mysqlTable("serviceRequests", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  serviceId: int("serviceId"),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientPhone: varchar("clientPhone", { length: 20 }),
  notes: text("notes"),
  preferredAt: timestamp("preferredAt"),
  status: mysqlEnum("status", ["new", "in_progress", "completed", "cancelled"]).default("new").notNull(),
  assignedToUserId: int("assignedToUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = typeof serviceRequests.$inferInsert;

export const sitePages = mysqlTable("sitePages", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  isPublished: boolean("isPublished").default(true).notNull(),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SitePage = typeof sitePages.$inferSelect;
export type InsertSitePage = typeof sitePages.$inferInsert;

export const publicTeamMembers = mysqlTable("publicTeamMembers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublicTeamMember = typeof publicTeamMembers.$inferSelect;
export type InsertPublicTeamMember = typeof publicTeamMembers.$inferInsert;

export const practiceAreas = mysqlTable("practiceAreas", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PracticeArea = typeof practiceAreas.$inferSelect;
export type InsertPracticeArea = typeof practiceAreas.$inferInsert;

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientTitle: varchar("clientTitle", { length: 255 }),
  content: text("content").notNull(),
  rating: int("rating").default(5).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

export const contactMessages = mysqlTable("contactMessages", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "replied", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  slug: varchar("slug", { length: 150 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  isPublished: boolean("isPublished").default(true).notNull(),
  publishedAt: timestamp("publishedAt"),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

export const toolUsage = mysqlTable("toolUsage", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  tool: varchar("tool", { length: 64 }).notNull(),
  day: varchar("day", { length: 10 }).notNull(),
  count: int("count").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ToolUsage = typeof toolUsage.$inferSelect;
export type InsertToolUsage = typeof toolUsage.$inferInsert;

export const legalSourceDocuments = mysqlTable("legalSourceDocuments", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 64 }).notNull(),
  url: text("url").notNull(),
  title: text("title"),
  contentText: longtext("contentText"),
  contentHash: varchar("contentHash", { length: 64 }),
  httpStatus: int("httpStatus"),
  etag: varchar("etag", { length: 255 }),
  lastModified: varchar("lastModified", { length: 255 }),
  fetchedAt: timestamp("fetchedAt"),
  status: mysqlEnum("status", ["ok", "error", "skipped"]).default("ok").notNull(),
  error: longtext("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LegalSourceDocument = typeof legalSourceDocuments.$inferSelect;
export type InsertLegalSourceDocument = typeof legalSourceDocuments.$inferInsert;

export const legalSourceChunks = mysqlTable("legalSourceChunks", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  text: text("text").notNull(),
  embeddingJson: text("embeddingJson"),
  metaJson: text("metaJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LegalSourceChunk = typeof legalSourceChunks.$inferSelect;
export type InsertLegalSourceChunk = typeof legalSourceChunks.$inferInsert;

export const legalCrawlerRuns = mysqlTable("legalCrawlerRuns", {
  id: int("id").autoincrement().primaryKey(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  finishedAt: timestamp("finishedAt"),
  status: mysqlEnum("status", ["running", "success", "error"]).default("running").notNull(),
  pagesCrawled: int("pagesCrawled").default(0).notNull(),
  documentsUpdated: int("documentsUpdated").default(0).notNull(),
  error: longtext("error"),
});

export type LegalCrawlerRun = typeof legalCrawlerRuns.$inferSelect;
export type InsertLegalCrawlerRun = typeof legalCrawlerRuns.$inferInsert;
