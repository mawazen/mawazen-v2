import { eq, desc, and, like, or, sql, gte, lte, count, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  organizations,
  InsertOrganization,
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
  serviceProjects,
  serviceProjectExpenses,
  serviceCatalog,
  serviceRequests,
  sitePages,
  publicTeamMembers,
  practiceAreas,
  testimonials,
  contactMessages,
  blogPosts,
  toolUsage,
  legalSourceDocuments,
  legalSourceChunks,
  legalCrawlerRuns,
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
  InsertServiceProject,
  InsertServiceProjectExpense,
  InsertServiceCatalogItem,
  InsertServiceRequest,
  InsertSitePage,
  InsertPublicTeamMember,
  InsertPracticeArea,
  InsertTestimonial,
  InsertContactMessage,
  InsertBlogPost,
  InsertToolUsage,
  InsertLegalSourceDocument,
  InsertLegalSourceChunk,
  InsertLegalCrawlerRun,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _schemaInitPromise: Promise<void> | null = null;

// In-memory user storage for local development
const inMemoryUsers = new Map<string, any>();
const inMemoryOrganizations = new Map<number, any>();
const inMemoryDocuments = new Map<number, any>();
const inMemoryServiceProjects = new Map<number, any>();
const inMemoryServiceProjectExpenses = new Map<number, any>();
const inMemoryServiceCatalog = new Map<number, any>();
const inMemoryServiceRequests = new Map<number, any>();
const inMemorySitePages = new Map<number, any>();
const inMemoryPublicTeamMembers = new Map<number, any>();
const inMemoryPracticeAreas = new Map<number, any>();
const inMemoryTestimonials = new Map<number, any>();
const inMemoryContactMessages = new Map<number, any>();
const inMemoryBlogPosts = new Map<number, any>();
const inMemoryToolUsage = new Map<string, any>();
const inMemoryLegalDocuments = new Map<number, any>();
const inMemoryLegalChunks = new Map<number, any>();
const inMemoryLegalRuns = new Map<number, any>();

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }

  }
  if (_db) {
    await ensureSchemaInitialized(_db);
  }
  return _db;
}

async function ensureSchemaInitialized(db: ReturnType<typeof drizzle>) {
  if (_schemaInitPromise) return _schemaInitPromise;
  _schemaInitPromise = (async () => {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS organizations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NULL,
          subscriptionPlan ENUM('individual','law_firm','enterprise') NOT NULL DEFAULT 'individual',
          seatLimit INT NOT NULL DEFAULT 1,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      const colCheck: any = await db.execute(sql`
        SELECT COUNT(*) AS cnt
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'organizationId'
      `);

      const rows = (colCheck as any)?.[0] ?? (colCheck as any)?.rows ?? colCheck;
      const cntRaw = Array.isArray(rows) ? rows[0]?.cnt : (rows as any)?.cnt;
      const cnt = typeof cntRaw === "number" ? cntRaw : Number(cntRaw ?? 0);

      if (!Number.isFinite(cnt) || cnt <= 0) {
        await db.execute(sql`
          ALTER TABLE users
          ADD COLUMN organizationId INT NULL
        `);
      }

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS serviceCatalog (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizationId INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          durationMinutes INT NOT NULL DEFAULT 60,
          priceAmount BIGINT NOT NULL DEFAULT 0,
          currency VARCHAR(10) NOT NULL DEFAULT 'SAR',
          isActive BOOLEAN NOT NULL DEFAULT TRUE,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS serviceRequests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizationId INT NOT NULL,
          serviceId INT NULL,
          clientName VARCHAR(255) NOT NULL,
          clientEmail VARCHAR(320) NULL,
          clientPhone VARCHAR(20) NULL,
          notes TEXT NULL,
          preferredAt TIMESTAMP NULL,
          status ENUM('new','in_progress','completed','cancelled') NOT NULL DEFAULT 'new',
          assignedToUserId INT NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sitePages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizationId INT NOT NULL,
          slug VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NULL,
          isPublished BOOLEAN NOT NULL DEFAULT TRUE,
          updatedByUserId INT NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS publicTeamMembers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizationId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          title VARCHAR(255) NULL,
          bio TEXT NULL,
          avatarUrl TEXT NULL,
          sortOrder INT NOT NULL DEFAULT 0,
          isActive BOOLEAN NOT NULL DEFAULT TRUE,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS practiceAreas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizationId INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          sortOrder INT NOT NULL DEFAULT 0,
          isActive BOOLEAN NOT NULL DEFAULT TRUE,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS testimonials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizationId INT NOT NULL,
          clientName VARCHAR(255) NOT NULL,
          clientTitle VARCHAR(255) NULL,
          content TEXT NOT NULL,
          rating INT NOT NULL DEFAULT 5,
          isPublished BOOLEAN NOT NULL DEFAULT TRUE,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS contactMessages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizationId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(320) NULL,
          phone VARCHAR(20) NULL,
          message TEXT NOT NULL,
          status ENUM('new','replied','closed') NOT NULL DEFAULT 'new',
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blogPosts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizationId INT NOT NULL,
          slug VARCHAR(150) NOT NULL,
          title VARCHAR(255) NOT NULL,
          excerpt TEXT NULL,
          content TEXT NULL,
          isPublished BOOLEAN NOT NULL DEFAULT TRUE,
          publishedAt TIMESTAMP NULL,
          updatedByUserId INT NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS toolUsage (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizationId INT NOT NULL,
          tool VARCHAR(64) NOT NULL,
          day VARCHAR(10) NOT NULL,
          count INT NOT NULL DEFAULT 0,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS legalSourceDocuments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          source VARCHAR(64) NOT NULL,
          url TEXT NOT NULL,
          title TEXT NULL,
          contentText LONGTEXT NULL,
          contentHash VARCHAR(64) NULL,
          httpStatus INT NULL,
          etag VARCHAR(255) NULL,
          lastModified VARCHAR(255) NULL,
          fetchedAt TIMESTAMP NULL,
          status ENUM('ok','error','skipped') NOT NULL DEFAULT 'ok',
          error LONGTEXT NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS legalSourceChunks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          documentId INT NOT NULL,
          chunkIndex INT NOT NULL,
          text TEXT NOT NULL,
          embeddingJson TEXT NULL,
          metaJson TEXT NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS legalCrawlerRuns (
          id INT AUTO_INCREMENT PRIMARY KEY,
          startedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          finishedAt TIMESTAMP NULL,
          status ENUM('running','success','error') NOT NULL DEFAULT 'running',
          pagesCrawled INT NOT NULL DEFAULT 0,
          documentsUpdated INT NOT NULL DEFAULT 0,
          error LONGTEXT NULL
        )
      `);
    } catch (error) {
      console.warn("[Database] Schema initialization failed:", error);
    }
  })();
  return _schemaInitPromise;
}

export async function createLegalCrawlerRun(run: InsertLegalCrawlerRun) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    inMemoryLegalRuns.set(id, { id, ...run });
    return id;
  }
  const result = await db.insert(legalCrawlerRuns).values(run as any);
  return result[0].insertId;
}

export async function finishLegalCrawlerRun(params: {
  id: number;
  status: "success" | "error";
  pagesCrawled: number;
  documentsUpdated: number;
  error?: string | null;
}) {
  const truncateForDb = (value: string | null | undefined, maxLen: number) => {
    if (!value) return null;
    const s = String(value);
    if (s.length <= maxLen) return s;
    return `${s.slice(0, maxLen)}\n...[truncated ${s.length - maxLen} chars]`;
  };

  const db = await getDb();
  if (!db) {
    const existing = inMemoryLegalRuns.get(params.id) ?? { id: params.id };
    inMemoryLegalRuns.set(params.id, {
      ...existing,
      status: params.status,
      pagesCrawled: params.pagesCrawled,
      documentsUpdated: params.documentsUpdated,
      error: truncateForDb(params.error, 8000),
      finishedAt: new Date(),
    });
    return;
  }

  await db
    .update(legalCrawlerRuns)
    .set({
      status: params.status,
      pagesCrawled: params.pagesCrawled,
      documentsUpdated: params.documentsUpdated,
      error: truncateForDb(params.error, 8000),
      finishedAt: new Date(),
    } as any)
    .where(eq(legalCrawlerRuns.id, params.id));
}

export async function upsertLegalSourceDocument(doc: InsertLegalSourceDocument) {
  const truncateForDb = (value: string | null | undefined, maxLen: number) => {
    if (!value) return null;
    const s = String(value);
    if (s.length <= maxLen) return s;
    return `${s.slice(0, maxLen)}\n...[truncated ${s.length - maxLen} chars]`;
  };

  // Protect DB from oversized error strings (some drivers include full response bodies / params)
  const safeDoc: any = {
    ...doc,
    error: truncateForDb((doc as any).error, 8000),
  };

  const dbConn = await getDb();
  if (!dbConn) {
    const existing = Array.from(inMemoryLegalDocuments.values()).find((d) => d.source === doc.source && d.url === doc.url);
    if (existing?.id) {
      inMemoryLegalDocuments.set(existing.id, { ...existing, ...safeDoc, updatedAt: new Date() });
      return existing.id as number;
    }
    const id = Date.now();
    inMemoryLegalDocuments.set(id, { id, ...safeDoc, createdAt: new Date(), updatedAt: new Date() });
    return id;
  }

  const existing = await dbConn
    .select({ id: legalSourceDocuments.id, contentHash: legalSourceDocuments.contentHash })
    .from(legalSourceDocuments)
    .where(and(eq(legalSourceDocuments.source, doc.source), eq(legalSourceDocuments.url, doc.url)))
    .limit(1);

  if (existing[0]?.id) {
    await dbConn.update(legalSourceDocuments).set(safeDoc).where(eq(legalSourceDocuments.id, existing[0].id));
    return existing[0].id;
  }

  const result = await dbConn.insert(legalSourceDocuments).values(safeDoc);
  return result[0].insertId;
}

export async function getLegalSourceDocumentBySourceUrl(params: { source: string; url: string }) {
  const dbConn = await getDb();
  if (!dbConn) {
    return Array.from(inMemoryLegalDocuments.values()).find((d) => d.source === params.source && d.url === params.url) ?? null;
  }
  const rows = await dbConn
    .select()
    .from(legalSourceDocuments)
    .where(and(eq(legalSourceDocuments.source, params.source), eq(legalSourceDocuments.url, params.url)))
    .limit(1);
  return rows[0] ?? null;
}

export async function replaceLegalChunksForDocument(params: { documentId: number; chunks: Array<Omit<InsertLegalSourceChunk, "documentId">> }) {
  const dbConn = await getDb();
  if (!dbConn) {
    // Remove old chunks
    for (const [id, chunk] of Array.from(inMemoryLegalChunks.entries())) {
      if (chunk.documentId === params.documentId) inMemoryLegalChunks.delete(id);
    }
    for (const c of params.chunks) {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      inMemoryLegalChunks.set(id, { id, documentId: params.documentId, ...c, createdAt: new Date(), updatedAt: new Date() });
    }
    return;
  }

  await dbConn.delete(legalSourceChunks).where(eq(legalSourceChunks.documentId, params.documentId));
  if (params.chunks.length === 0) return;

  await dbConn.insert(legalSourceChunks).values(
    params.chunks.map((c) => ({
      documentId: params.documentId,
      ...c,
    })) as any
  );
}

export async function listLegalChunksWithEmbeddings(params: { limit: number }) {
  const dbConn = await getDb();
  if (!dbConn) {
    const chunks = Array.from(inMemoryLegalChunks.values())
      .filter((c) => typeof c.embeddingJson === "string" && c.embeddingJson.length > 0)
      .slice(0, params.limit);
    const docById = new Map<number, any>(Array.from(inMemoryLegalDocuments.values()).map((d) => [d.id, d]));
    return chunks.map((c) => ({
      ...c,
      document: docById.get(c.documentId) ?? null,
    }));
  }

  const rows = await dbConn
    .select({
      chunkId: legalSourceChunks.id,
      documentId: legalSourceChunks.documentId,
      chunkIndex: legalSourceChunks.chunkIndex,
      text: legalSourceChunks.text,
      embeddingJson: legalSourceChunks.embeddingJson,
      metaJson: legalSourceChunks.metaJson,
      url: legalSourceDocuments.url,
      source: legalSourceDocuments.source,
      title: legalSourceDocuments.title,
    })
    .from(legalSourceChunks)
    .innerJoin(legalSourceDocuments, eq(legalSourceDocuments.id, legalSourceChunks.documentId))
    .where(sql`${legalSourceChunks.embeddingJson} IS NOT NULL`)
    .limit(params.limit);

  return rows;
}

export async function listLegalChunksByTextSearch(params: { terms: string[]; limit: number }) {
  const terms = (params.terms ?? []).map((t) => String(t ?? "").trim()).filter(Boolean);
  if (terms.length === 0) return [];

  const dbConn = await getDb();
  if (!dbConn) {
    const docById = new Map<number, any>(Array.from(inMemoryLegalDocuments.values()).map((d) => [d.id, d]));
    const chunks = Array.from(inMemoryLegalChunks.values())
      .filter((c) => {
        const text = String(c?.text ?? "");
        return terms.some((t) => text.includes(t));
      })
      .slice(0, params.limit);

    return chunks.map((c) => ({
      chunkId: c.id,
      documentId: c.documentId,
      chunkIndex: c.chunkIndex,
      text: c.text,
      embeddingJson: c.embeddingJson,
      metaJson: c.metaJson,
      url: docById.get(c.documentId)?.url ?? "",
      source: docById.get(c.documentId)?.source ?? "",
      title: docById.get(c.documentId)?.title ?? null,
    }));
  }

  const whereClause = or(
    ...terms.map((t) => like(legalSourceChunks.text as any, `%${t}%`))
  );

  const rows = await dbConn
    .select({
      chunkId: legalSourceChunks.id,
      documentId: legalSourceChunks.documentId,
      chunkIndex: legalSourceChunks.chunkIndex,
      text: legalSourceChunks.text,
      embeddingJson: legalSourceChunks.embeddingJson,
      metaJson: legalSourceChunks.metaJson,
      url: legalSourceDocuments.url,
      source: legalSourceDocuments.source,
      title: legalSourceDocuments.title,
    })
    .from(legalSourceChunks)
    .innerJoin(legalSourceDocuments, eq(legalSourceDocuments.id, legalSourceChunks.documentId))
    .where(whereClause)
    .limit(params.limit);

  return rows;
}

function toDayKey(date: Date) {
  // YYYY-MM-DD
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getToolUsageCount(params: { organizationId: number; tool: string; day?: string }) {
  const day = params.day ?? toDayKey(new Date());
  const db = await getDb();
  if (!db) {
    const key = `${params.organizationId}:${params.tool}:${day}`;
    return inMemoryToolUsage.get(key)?.count ?? 0;
  }

  const rows = await db
    .select({ count: toolUsage.count })
    .from(toolUsage)
    .where(and(eq(toolUsage.organizationId, params.organizationId), eq(toolUsage.tool, params.tool), eq(toolUsage.day, day)))
    .limit(1);

  return rows[0]?.count ?? 0;
}

export async function incrementToolUsage(params: { organizationId: number; tool: string; increment?: number; day?: string }) {
  const day = params.day ?? toDayKey(new Date());
  const inc = params.increment ?? 1;
  const db = await getDb();
  if (!db) {
    const key = `${params.organizationId}:${params.tool}:${day}`;
    const existing = inMemoryToolUsage.get(key) ?? { count: 0 };
    inMemoryToolUsage.set(key, { ...existing, count: (existing.count ?? 0) + inc, updatedAt: new Date() });
    return;
  }

  const existing = await db
    .select({ id: toolUsage.id, count: toolUsage.count })
    .from(toolUsage)
    .where(and(eq(toolUsage.organizationId, params.organizationId), eq(toolUsage.tool, params.tool), eq(toolUsage.day, day)))
    .limit(1);

  if (existing[0]?.id) {
    await db.update(toolUsage).set({ count: (existing[0].count ?? 0) + inc } as any).where(eq(toolUsage.id, existing[0].id));
    return;
  }

  const row: InsertToolUsage = {
    organizationId: params.organizationId,
    tool: params.tool,
    day,
    count: inc,
  };
  await db.insert(toolUsage).values(row);
}

export async function getDefaultPublicOrganizationId() {
  if (ENV.ownerOpenId) {
    const owner = await getUserByOpenId(ENV.ownerOpenId);
    if (owner?.organizationId) return owner.organizationId;
  }

  const db = await getDb();
  if (!db) {
    const first = Array.from(inMemoryOrganizations.keys()).sort((a, b) => a - b)[0];
    if (first) return first;
    const id = await createOrganization({
      name: "Default",
      subscriptionPlan: "individual",
      seatLimit: 1,
    });
    return id;
  }

  const orgs = await db.select({ id: organizations.id }).from(organizations).orderBy(asc(organizations.id)).limit(1);
  if (orgs[0]?.id) return orgs[0].id;

  const id = await createOrganization({
    name: "Default",
    subscriptionPlan: "individual",
    seatLimit: 1,
  });
  return id;
}

// ==================== ORGANIZATION FUNCTIONS ====================
export async function createOrganization(org: InsertOrganization) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    inMemoryOrganizations.set(id, {
      id,
      ...org,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  }

  const result = await db.insert(organizations).values(org);
  return result[0].insertId;
}

export async function getOrganizationById(orgId: number) {
  const db = await getDb();
  if (!db) return inMemoryOrganizations.get(orgId);
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return result[0];
}

export async function getAllOrganizations() {
  const db = await getDb();
  if (!db) return Array.from(inMemoryOrganizations.values());
  return db.select().from(organizations).orderBy(desc(organizations.createdAt));
}

export async function setOrganizationSubscriptionPlan(params: {
  organizationId: number;
  subscriptionPlan: "individual" | "law_firm" | "enterprise";
  seatLimit: number;
}) {
  const db = await getDb();
  if (!db) {
    const org = inMemoryOrganizations.get(params.organizationId);
    if (!org) throw new Error("Organization not found");
    inMemoryOrganizations.set(params.organizationId, {
      ...org,
      subscriptionPlan: params.subscriptionPlan,
      seatLimit: params.seatLimit,
      updatedAt: new Date(),
    });
    return;
  }

  await db
    .update(organizations)
    .set({
      subscriptionPlan: params.subscriptionPlan,
      seatLimit: params.seatLimit,
    })
    .where(eq(organizations.id, params.organizationId));
}

export async function getOrganizationMemberCount(organizationId: number) {
  const db = await getDb();
  if (!db) {
    let c = 0;
    for (const u of inMemoryUsers.values()) {
      if (u?.organizationId === organizationId) c += 1;
    }
    return c;
  }
  const result = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.organizationId, organizationId));
  return result[0]?.count ?? 0;
}

export async function getUsersByOrganizationId(organizationId: number) {
  const db = await getDb();
  if (!db) {
    const list: any[] = [];
    for (const u of inMemoryUsers.values()) {
      if (u?.organizationId === organizationId) list.push(u);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }
  return db
    .select()
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .orderBy(desc(users.createdAt));
}

export async function getServiceCatalogByOrganizationId(organizationId: number, onlyActive = false) {
  const db = await getDb();
  if (!db) {
    const list: any[] = [];
    for (const s of inMemoryServiceCatalog.values()) {
      if (s?.organizationId !== organizationId) continue;
      if (onlyActive && !s?.isActive) continue;
      list.push(s);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }
  const whereClause = onlyActive
    ? and(eq(serviceCatalog.organizationId, organizationId), eq(serviceCatalog.isActive, true))
    : eq(serviceCatalog.organizationId, organizationId);
  return db.select().from(serviceCatalog).where(whereClause).orderBy(desc(serviceCatalog.createdAt));
}

export async function createServiceCatalogItem(item: InsertServiceCatalogItem) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    inMemoryServiceCatalog.set(id, {
      id,
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  }
  const result = await db.insert(serviceCatalog).values(item);
  return result[0].insertId;
}

export async function updateServiceCatalogItem(id: number, data: Partial<InsertServiceCatalogItem>) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryServiceCatalog.get(id);
    if (!existing) throw new Error("Service not found");
    inMemoryServiceCatalog.set(id, { ...existing, ...data, updatedAt: new Date() });
    return;
  }
  await db.update(serviceCatalog).set(data as any).where(eq(serviceCatalog.id, id));
}

export async function createServiceRequest(req: InsertServiceRequest) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    inMemoryServiceRequests.set(id, {
      id,
      ...req,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  }
  const result = await db.insert(serviceRequests).values(req);
  return result[0].insertId;
}

export async function getServiceRequestsByOrganizationId(organizationId: number, status?: "new" | "in_progress" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) {
    const list: any[] = [];
    for (const r of inMemoryServiceRequests.values()) {
      if (r?.organizationId !== organizationId) continue;
      if (status && r?.status !== status) continue;
      list.push(r);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  const whereClause = status
    ? and(eq(serviceRequests.organizationId, organizationId), eq(serviceRequests.status, status))
    : eq(serviceRequests.organizationId, organizationId);

  return db.select().from(serviceRequests).where(whereClause).orderBy(desc(serviceRequests.createdAt));
}

export async function updateServiceRequest(id: number, data: Partial<InsertServiceRequest>) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryServiceRequests.get(id);
    if (!existing) throw new Error("Service request not found");
    inMemoryServiceRequests.set(id, { ...existing, ...data, updatedAt: new Date() });
    return;
  }
  await db.update(serviceRequests).set(data as any).where(eq(serviceRequests.id, id));
}

export async function getSitePageBySlug(params: { organizationId: number; slug: string; onlyPublished?: boolean }) {
  const db = await getDb();
  if (!db) {
    for (const p of inMemorySitePages.values()) {
      if (p?.organizationId !== params.organizationId) continue;
      if (p?.slug !== params.slug) continue;
      if (params.onlyPublished && !p?.isPublished) continue;
      return p;
    }
    return undefined;
  }

  const whereClause = params.onlyPublished
    ? and(eq(sitePages.organizationId, params.organizationId), eq(sitePages.slug, params.slug), eq(sitePages.isPublished, true))
    : and(eq(sitePages.organizationId, params.organizationId), eq(sitePages.slug, params.slug));

  const result = await db.select().from(sitePages).where(whereClause).limit(1);
  return result[0];
}

export async function upsertSitePage(page: InsertSitePage) {
  const db = await getDb();
  if (!db) {
    const existing = Array.from(inMemorySitePages.values()).find(
      (p) => p?.organizationId === page.organizationId && p?.slug === page.slug
    );
    if (existing) {
      inMemorySitePages.set(existing.id, { ...existing, ...page, updatedAt: new Date() });
      return existing.id;
    }
    const id = Date.now();
    inMemorySitePages.set(id, { id, ...page, createdAt: new Date(), updatedAt: new Date() });
    return id;
  }

  const existing = await db
    .select({ id: sitePages.id })
    .from(sitePages)
    .where(and(eq(sitePages.organizationId, page.organizationId), eq(sitePages.slug, page.slug)))
    .limit(1);

  if (existing[0]?.id) {
    await db.update(sitePages).set(page as any).where(eq(sitePages.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(sitePages).values(page);
  return result[0].insertId;
}

export async function listSitePagesByOrganizationId(organizationId: number) {
  const db = await getDb();
  if (!db) {
    const list: any[] = [];
    for (const p of inMemorySitePages.values()) {
      if (p?.organizationId === organizationId) list.push(p);
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }
  return db.select().from(sitePages).where(eq(sitePages.organizationId, organizationId)).orderBy(desc(sitePages.updatedAt));
}

export async function listPublicTeamMembers(organizationId: number, onlyActive = true) {
  const db = await getDb();
  if (!db) {
    const list: any[] = [];
    for (const m of inMemoryPublicTeamMembers.values()) {
      if (m?.organizationId !== organizationId) continue;
      if (onlyActive && !m?.isActive) continue;
      list.push(m);
    }
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return list;
  }
  const whereClause = onlyActive
    ? and(eq(publicTeamMembers.organizationId, organizationId), eq(publicTeamMembers.isActive, true))
    : eq(publicTeamMembers.organizationId, organizationId);
  return db.select().from(publicTeamMembers).where(whereClause).orderBy(asc(publicTeamMembers.sortOrder));
}

export async function createPublicTeamMember(member: InsertPublicTeamMember) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    inMemoryPublicTeamMembers.set(id, { id, ...member, createdAt: new Date(), updatedAt: new Date() });
    return id;
  }
  const result = await db.insert(publicTeamMembers).values(member);
  return result[0].insertId;
}

export async function updatePublicTeamMember(id: number, data: Partial<InsertPublicTeamMember>) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryPublicTeamMembers.get(id);
    if (!existing) throw new Error("Team member not found");
    inMemoryPublicTeamMembers.set(id, { ...existing, ...data, updatedAt: new Date() });
    return;
  }
  await db.update(publicTeamMembers).set(data as any).where(eq(publicTeamMembers.id, id));
}

export async function listPracticeAreas(organizationId: number, onlyActive = true) {
  const db = await getDb();
  if (!db) {
    const list: any[] = [];
    for (const a of inMemoryPracticeAreas.values()) {
      if (a?.organizationId !== organizationId) continue;
      if (onlyActive && !a?.isActive) continue;
      list.push(a);
    }
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return list;
  }
  const whereClause = onlyActive
    ? and(eq(practiceAreas.organizationId, organizationId), eq(practiceAreas.isActive, true))
    : eq(practiceAreas.organizationId, organizationId);
  return db.select().from(practiceAreas).where(whereClause).orderBy(asc(practiceAreas.sortOrder));
}

export async function createPracticeArea(area: InsertPracticeArea) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    inMemoryPracticeAreas.set(id, { id, ...area, createdAt: new Date(), updatedAt: new Date() });
    return id;
  }
  const result = await db.insert(practiceAreas).values(area);
  return result[0].insertId;
}

export async function updatePracticeArea(id: number, data: Partial<InsertPracticeArea>) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryPracticeAreas.get(id);
    if (!existing) throw new Error("Practice area not found");
    inMemoryPracticeAreas.set(id, { ...existing, ...data, updatedAt: new Date() });
    return;
  }
  await db.update(practiceAreas).set(data as any).where(eq(practiceAreas.id, id));
}

export async function listTestimonials(organizationId: number, onlyPublished = true) {
  const db = await getDb();
  if (!db) {
    const list: any[] = [];
    for (const t of inMemoryTestimonials.values()) {
      if (t?.organizationId !== organizationId) continue;
      if (onlyPublished && !t?.isPublished) continue;
      list.push(t);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }
  const whereClause = onlyPublished
    ? and(eq(testimonials.organizationId, organizationId), eq(testimonials.isPublished, true))
    : eq(testimonials.organizationId, organizationId);
  return db.select().from(testimonials).where(whereClause).orderBy(desc(testimonials.createdAt));
}

export async function createTestimonial(t: InsertTestimonial) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    inMemoryTestimonials.set(id, { id, ...t, createdAt: new Date(), updatedAt: new Date() });
    return id;
  }
  const result = await db.insert(testimonials).values(t);
  return result[0].insertId;
}

export async function updateTestimonial(id: number, data: Partial<InsertTestimonial>) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryTestimonials.get(id);
    if (!existing) throw new Error("Testimonial not found");
    inMemoryTestimonials.set(id, { ...existing, ...data, updatedAt: new Date() });
    return;
  }
  await db.update(testimonials).set(data as any).where(eq(testimonials.id, id));
}

export async function createContactMessage(msg: InsertContactMessage) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    inMemoryContactMessages.set(id, { id, ...msg, createdAt: new Date() });
    return id;
  }
  const result = await db.insert(contactMessages).values(msg);
  return result[0].insertId;
}

export async function listContactMessagesByOrganizationId(organizationId: number, status?: "new" | "replied" | "closed") {
  const db = await getDb();
  if (!db) {
    const list: any[] = [];
    for (const m of inMemoryContactMessages.values()) {
      if (m?.organizationId !== organizationId) continue;
      if (status && m?.status !== status) continue;
      list.push(m);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }
  const whereClause = status
    ? and(eq(contactMessages.organizationId, organizationId), eq(contactMessages.status, status))
    : eq(contactMessages.organizationId, organizationId);
  return db.select().from(contactMessages).where(whereClause).orderBy(desc(contactMessages.createdAt));
}

export async function updateContactMessageStatus(id: number, status: "new" | "replied" | "closed") {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryContactMessages.get(id);
    if (!existing) throw new Error("Contact message not found");
    inMemoryContactMessages.set(id, { ...existing, status });
    return;
  }
  await db.update(contactMessages).set({ status } as any).where(eq(contactMessages.id, id));
}

export async function listBlogPostsByOrganizationId(organizationId: number, onlyPublished = true) {
  const db = await getDb();
  if (!db) {
    const list: any[] = [];
    for (const p of inMemoryBlogPosts.values()) {
      if (p?.organizationId !== organizationId) continue;
      if (onlyPublished && !p?.isPublished) continue;
      list.push(p);
    }
    list.sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime());
    return list;
  }

  const whereClause = onlyPublished
    ? and(eq(blogPosts.organizationId, organizationId), eq(blogPosts.isPublished, true))
    : eq(blogPosts.organizationId, organizationId);

  return db.select().from(blogPosts).where(whereClause).orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));
}

export async function getBlogPostBySlug(params: { organizationId: number; slug: string; onlyPublished?: boolean }) {
  const db = await getDb();
  if (!db) {
    for (const p of inMemoryBlogPosts.values()) {
      if (p?.organizationId !== params.organizationId) continue;
      if (p?.slug !== params.slug) continue;
      if (params.onlyPublished && !p?.isPublished) continue;
      return p;
    }
    return undefined;
  }

  const whereClause = params.onlyPublished
    ? and(eq(blogPosts.organizationId, params.organizationId), eq(blogPosts.slug, params.slug), eq(blogPosts.isPublished, true))
    : and(eq(blogPosts.organizationId, params.organizationId), eq(blogPosts.slug, params.slug));

  const result = await db.select().from(blogPosts).where(whereClause).limit(1);
  return result[0];
}

export async function upsertBlogPost(post: InsertBlogPost) {
  const db = await getDb();
  const now = new Date();
  const normalized: InsertBlogPost = {
    ...post,
    publishedAt: post.isPublished ? (post.publishedAt ?? now) : (post.publishedAt ?? null),
  };

  if (!db) {
    const existing = Array.from(inMemoryBlogPosts.values()).find(
      (p) => p?.organizationId === normalized.organizationId && p?.slug === normalized.slug
    );
    if (existing) {
      inMemoryBlogPosts.set(existing.id, { ...existing, ...normalized, updatedAt: now });
      return existing.id;
    }
    const id = Date.now();
    inMemoryBlogPosts.set(id, { id, ...normalized, createdAt: now, updatedAt: now });
    return id;
  }

  const existing = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(and(eq(blogPosts.organizationId, normalized.organizationId), eq(blogPosts.slug, normalized.slug)))
    .limit(1);

  if (existing[0]?.id) {
    await db.update(blogPosts).set(normalized as any).where(eq(blogPosts.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(blogPosts).values(normalized);
  return result[0].insertId;
}

export async function ensureUserHasOrganization(params: {
  openId: string;
  defaultOrganizationName?: string | null;
}) {
  const user = await getUserByOpenId(params.openId);
  if (!user) throw new Error("User not found");
  if (user.organizationId) return user.organizationId;

  const fallbackPlan = user.subscriptionPlan ?? "individual";
  const fallbackSeatLimit = user.seatLimit ?? 1;
  const organizationId = await createOrganization({
    name: params.defaultOrganizationName ?? user.name ?? null,
    subscriptionPlan: fallbackPlan as any,
    seatLimit: fallbackSeatLimit,
  });

  await upsertUser({
    openId: user.openId,
    organizationId,
  });

  return organizationId;
}

// ==================== USER FUNCTIONS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Using in-memory storage for user:", user.openId);
    const normalizeOptional = (value: unknown) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value === "string") {
        const t = value.trim();
        return t.length > 0 ? t : null;
      }
      return value as any;
    };

    const nextEmail = typeof user.email === "string" ? user.email.trim().toLowerCase() : normalizeOptional(user.email);
    const nextPhone = normalizeOptional(user.phone);
    if (typeof nextEmail === "string") {
      for (const [openId, existing] of inMemoryUsers.entries()) {
        if (openId === user.openId) continue;
        const v = typeof existing?.email === "string" ? existing.email.trim() : "";
        if (v && v.toLowerCase() === nextEmail) {
          throw new Error("EMAIL_ALREADY_IN_USE");
        }
      }
    }
    if (typeof nextPhone === "string") {
      for (const [openId, existing] of inMemoryUsers.entries()) {
        if (openId === user.openId) continue;
        const v = typeof existing?.phone === "string" ? existing.phone.trim() : "";
        if (v && v === nextPhone) {
          throw new Error("PHONE_ALREADY_IN_USE");
        }
      }
    }

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

    const normalizeTextField = (field: TextField, value: unknown) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value !== "string") return value as any;
      const trimmed = value.trim();
      if ((field === "email" || field === "phone") && trimmed.length === 0) return null;
      if (field === "email") return trimmed.toLowerCase();
      return trimmed;
    };

    const assignNullable = (field: TextField) => {
      const value = normalizeTextField(field, user[field]);
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.organizationId !== undefined) {
      const normalized = user.organizationId ?? null;
      values.organizationId = normalized as any;
      updateSet.organizationId = normalized;
    }

    if (user.accountType !== undefined) {
      values.accountType = user.accountType;
      updateSet.accountType = user.accountType;
    } else {
      values.accountType = "individual";
    }

    if (user.subscriptionPlan !== undefined) {
      values.subscriptionPlan = user.subscriptionPlan;
      updateSet.subscriptionPlan = user.subscriptionPlan;
    } else {
      values.subscriptionPlan = "individual";
    }

    if (user.seatLimit !== undefined) {
      values.seatLimit = user.seatLimit;
      updateSet.seatLimit = user.seatLimit;
    } else {
      values.seatLimit = 1;
    }

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

    const nextEmail = typeof values.email === "string" ? values.email.trim().toLowerCase() : null;
    const nextPhone = typeof values.phone === "string" ? values.phone.trim() : null;

    if (nextEmail) {
      const dup = await db
        .select({ id: users.id })
        .from(users)
        .where(and(sql`LOWER(${users.email}) = ${nextEmail}`, sql`${users.openId} <> ${user.openId}`))
        .limit(1);
      if (dup.length > 0) throw new Error("EMAIL_ALREADY_IN_USE");
    }

    if (nextPhone) {
      const dup = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.phone, nextPhone as any), sql`${users.openId} <> ${user.openId}`))
        .limit(1);
      if (dup.length > 0) throw new Error("PHONE_ALREADY_IN_USE");
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

export async function getUserByEmail(email: string) {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return undefined;

  const db = await getDb();
  if (!db) {
    for (const u of inMemoryUsers.values()) {
      const value = typeof u?.email === "string" ? u.email.trim() : "";
      if (value && value.toLowerCase() === normalized.toLowerCase()) return u;
    }
    return undefined;
  }

  const rows = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = ${normalized}`)
    .limit(1);
  return rows[0] ?? undefined;
}

export async function getUserByPhone(phone: string) {
  const normalized = (phone ?? "").trim();
  if (!normalized) return undefined;

  const db = await getDb();
  if (!db) {
    for (const u of inMemoryUsers.values()) {
      const value = typeof u?.phone === "string" ? u.phone.trim() : "";
      if (value && value === normalized) return u;
    }
    return undefined;
  }

  const rows = await db.select().from(users).where(eq(users.phone, normalized as any)).limit(1);
  return rows[0] ?? undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    for (const u of inMemoryUsers.values()) {
      if (u?.id === userId) return u;
    }
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function setUserActive(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) {
    for (const [openId, user] of inMemoryUsers.entries()) {
      if (user?.id === userId) {
        inMemoryUsers.set(openId, {
          ...user,
          isActive,
          updatedAt: new Date(),
        });
        return;
      }
    }
    throw new Error("User not found");
  }

  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

export async function setUserSubscriptionPlan(params: {
  userId: number;
  subscriptionPlan: "individual" | "law_firm" | "enterprise";
  accountType: "individual" | "law_firm" | "enterprise";
  seatLimit: number;
}) {
  const db = await getDb();
  if (!db) {
    for (const [openId, user] of inMemoryUsers.entries()) {
      if (user?.id === params.userId) {
        inMemoryUsers.set(openId, {
          ...user,
          subscriptionPlan: params.subscriptionPlan,
          accountType: params.accountType,
          seatLimit: params.seatLimit,
          updatedAt: new Date(),
        });
        return;
      }
    }
    throw new Error("User not found");
  }

  await db
    .update(users)
    .set({
      subscriptionPlan: params.subscriptionPlan,
      accountType: params.accountType,
      seatLimit: params.seatLimit,
    })
    .where(eq(users.id, params.userId));
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

export async function getClientByPortalToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.portalToken, token)).limit(1);
  const client = result[0] as any;
  if (!client) return undefined;
  if (client.portalEnabled !== true) return undefined;
  return client;
}

export async function getSharedDocumentsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.clientId, clientId),
        eq(documents.isSharedWithClient, true),
        or(eq(documents.isTemplate, false), sql`(${documents.isTemplate} IS NULL)`)
      )
    )
    .orderBy(desc(documents.createdAt));
}

export async function getClientCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(clients);
  return result[0]?.count ?? 0;
}

export async function getAllClients(search?: string) {
  const db = await getDb();
  if (!db) return [];

  if (search) {
    return db
      .select()
      .from(clients)
      .where(
        or(
          like(clients.name, `%${search}%`),
          like(clients.email, `%${search}%`),
          like(clients.phone, `%${search}%`)
        )
      )
      .orderBy(desc(clients.createdAt));
  }

  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

async function listClientIdsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [] as number[];
  const rows = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.createdById, userId));
  return rows.map((r) => r.id);
}

async function listCaseIdsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [] as number[];
  const clientIds = await listClientIdsByUserId(userId);
  if (clientIds.length === 0) return [];
  const rows = await db
    .select({ id: cases.id })
    .from(cases)
    .where(or(...clientIds.map((id) => eq(cases.clientId, id))));
  return rows.map((r) => r.id);
}

export async function getAllClientsByUserId(userId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];

  const base = eq(clients.createdById, userId);

  if (search) {
    return db
      .select()
      .from(clients)
      .where(
        and(
          base,
          or(
            like(clients.name, `%${search}%`),
            like(clients.email, `%${search}%`),
            like(clients.phone, `%${search}%`)
          )
        )
      )
      .orderBy(desc(clients.createdAt));
  }

  return db.select().from(clients).where(base).orderBy(desc(clients.createdAt));
}

export async function getClientByIdForUser(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.createdById, userId)))
    .limit(1);
  return result[0];
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

export async function getAllCasesByUserId(
  userId: number,
  filters?: { status?: string; type?: string; search?: string }
) {
  const db = await getDb();
  if (!db) return [];

  const clientIds = await listClientIdsByUserId(userId);
  if (clientIds.length === 0) return [];

  const conditions: any[] = [or(...clientIds.map((id) => eq(cases.clientId, id)))];

  if (filters?.status) {
    conditions.push(eq(cases.status, filters.status as any));
  }
  if (filters?.type) {
    conditions.push(eq(cases.type, filters.type as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(cases.caseNumber, `%${filters.search}%`),
        like(cases.title, `%${filters.search}%`)
      )
    );
  }

  return db
    .select()
    .from(cases)
    .where(and(...conditions))
    .orderBy(desc(cases.createdAt));
}

export async function getCasesByClientIdForUser(userId: number, clientId: number) {
  const owned = await getClientByIdForUser(userId, clientId);
  if (!owned) return [];
  return getCasesByClientId(clientId);
}

export async function getCaseByIdForUser(userId: number, id: number) {
  const row = await getCaseById(id);
  if (!row) return undefined;
  const owned = await getClientByIdForUser(userId, Number((row as any).clientId));
  if (!owned) return undefined;
  return row;
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

export async function getCaseStatsForUser(userId: number) {
  const list = (await getAllCasesByUserId(userId)) as any[];
  let total = 0;
  let active = 0;
  let won = 0;
  let lost = 0;
  let pending = 0;

  for (const c of list) {
    total += 1;
    if (c.status === "active") active += 1;
    if (c.status === "won") won += 1;
    if (c.status === "lost") lost += 1;
    if (c.status === "pending") pending += 1;
  }

  return { total, active, won, lost, pending };
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

export async function getHearingsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  const clientCases = await db.select({ id: cases.id }).from(cases).where(eq(cases.clientId, clientId));
  const ids = clientCases.map((c) => c.id);
  if (ids.length === 0) return [];
  return db
    .select()
    .from(hearings)
    .where(or(...ids.map((id) => eq(hearings.caseId, id))))
    .orderBy(desc(hearings.hearingDate));
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

export async function getUpcomingHearingsForUser(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];

  const caseIds = await listCaseIdsByUserId(userId);
  if (caseIds.length === 0) return [];

  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(hearings)
    .where(
      and(
        or(...caseIds.map((id) => eq(hearings.caseId, id))),
        gte(hearings.hearingDate, now),
        lte(hearings.hearingDate, future),
        eq(hearings.status, "scheduled")
      )
    )
    .orderBy(hearings.hearingDate);
}

export async function getHearingsByDateRangeForUser(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];

  const caseIds = await listCaseIdsByUserId(userId);
  if (caseIds.length === 0) return [];

  const conditions: any[] = [or(...caseIds.map((id) => eq(hearings.caseId, id)))];
  if (startDate) conditions.push(gte(hearings.hearingDate, startDate));
  if (endDate) conditions.push(lte(hearings.hearingDate, endDate));

  return db
    .select()
    .from(hearings)
    .where(and(...conditions))
    .orderBy(hearings.hearingDate);
}

export async function getHearingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(hearings).where(eq(hearings.id, id)).limit(1);
  return result[0];
}

export async function getHearingByIdForUser(userId: number, id: number) {
  const hearing = await getHearingById(id);
  if (!hearing) return undefined;
  const ownedCase = await getCaseByIdForUser(userId, Number((hearing as any).caseId));
  if (!ownedCase) return undefined;
  return hearing;
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
  if (!db) {
    const id = Date.now();
    const now = new Date();
    inMemoryDocuments.set(id, {
      id,
      ...doc,
      createdAt: doc.createdAt ?? now,
      updatedAt: doc.updatedAt ?? now,
    });
    return id;
  }

  const result = await db.insert(documents).values(doc);
  return result[0].insertId;
}

export async function updateDocument(id: number, doc: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryDocuments.get(id);
    if (!existing) throw new Error("Document not found");
    inMemoryDocuments.set(id, {
      ...existing,
      ...doc,
      updatedAt: new Date(),
    });
    return;
  }

  await db.update(documents).set(doc).where(eq(documents.id, id));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) {
    inMemoryDocuments.delete(id);
    return;
  }

  await db.delete(documents).where(eq(documents.id, id));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return inMemoryDocuments.get(id);

  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
}

export async function getDocumentsByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) {
    return Array.from(inMemoryDocuments.values())
      .filter((doc) => doc.caseId === caseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return db
    .select()
    .from(documents)
    .where(eq(documents.caseId, caseId))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) {
    return Array.from(inMemoryDocuments.values())
      .filter((doc) => doc.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return db
    .select()
    .from(documents)
    .where(eq(documents.clientId, clientId))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentTemplates() {
  const db = await getDb();
  if (!db) {
    return Array.from(inMemoryDocuments.values())
      .filter((doc) => Boolean(doc.isTemplate) === true)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return db
    .select()
    .from(documents)
    .where(eq(documents.isTemplate, true))
    .orderBy(desc(documents.createdAt));
}

export async function getAllDocuments(search?: string) {
  const db = await getDb();
  if (!db) {
    const all = Array.from(inMemoryDocuments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (search) {
      const q = search.toLowerCase();
      return all.filter((doc) => String(doc.name ?? "").toLowerCase().includes(q));
    }

    return all;
  }

  if (search) {
    return db
      .select()
      .from(documents)
      .where(like(documents.name, `%${search}%`))
      .orderBy(desc(documents.createdAt));
  }

  return db.select().from(documents).orderBy(desc(documents.createdAt));
}

export async function getAllDocumentsForUser(userId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];

  const base = eq(documents.uploadedById, userId);
  if (search) {
    return db
      .select()
      .from(documents)
      .where(and(base, like(documents.name, `%${search}%`)))
      .orderBy(desc(documents.createdAt));
  }

  return db.select().from(documents).where(base).orderBy(desc(documents.createdAt));
}

export async function getDocumentByIdForUser(userId: number, id: number) {
  const doc = await getDocumentById(id);
  if (!doc) return undefined;
  if (Number((doc as any).uploadedById) !== userId) return undefined;
  return doc;
}

export async function getDocumentsByCaseIdForUser(userId: number, caseId: number) {
  const ownedCase = await getCaseByIdForUser(userId, caseId);
  if (!ownedCase) return [];
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.caseId, caseId), eq(documents.uploadedById, userId)))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentsByClientIdForUser(userId: number, clientId: number) {
  const ownedClient = await getClientByIdForUser(userId, clientId);
  if (!ownedClient) return [];
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.clientId, clientId), eq(documents.uploadedById, userId)))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentTemplatesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.isTemplate, true), eq(documents.uploadedById, userId)))
    .orderBy(desc(documents.createdAt));
}

// ==================== SERVICE PROJECTS (Legal Services Workflow) ====================
export async function createServiceProject(project: InsertServiceProject) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    const now = new Date();
    inMemoryServiceProjects.set(id, {
      id,
      ...project,
      createdAt: project.createdAt ?? now,
      updatedAt: project.updatedAt ?? now,
    });
    return id;
  }
  const result = await db.insert(serviceProjects).values(project as any);
  return result[0].insertId;
}

export async function updateServiceProject(id: number, data: Partial<InsertServiceProject>) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryServiceProjects.get(id);
    if (!existing) throw new Error("Service project not found");
    inMemoryServiceProjects.set(id, {
      ...existing,
      ...data,
      updatedAt: new Date(),
    });
    return;
  }
  await db.update(serviceProjects).set(data as any).where(eq(serviceProjects.id, id));
}

export async function deleteServiceProject(id: number) {
  const db = await getDb();
  if (!db) {
    inMemoryServiceProjects.delete(id);
    // Also remove expenses
    for (const [eid, e] of inMemoryServiceProjectExpenses.entries()) {
      if (e?.serviceProjectId === id) inMemoryServiceProjectExpenses.delete(eid);
    }
    return;
  }
  await db.delete(serviceProjectExpenses).where(eq(serviceProjectExpenses.serviceProjectId, id));
  await db.delete(serviceProjects).where(eq(serviceProjects.id, id));
}

export async function getServiceProjectById(id: number) {
  const db = await getDb();
  if (!db) return inMemoryServiceProjects.get(id);
  const rows = await db.select().from(serviceProjects).where(eq(serviceProjects.id, id)).limit(1);
  return rows[0];
}

export async function listServiceProjectsByOrganizationId(params: {
  organizationId: number;
  status?: "new" | "in_progress" | "on_hold" | "completed" | "cancelled";
  search?: string;
}) {
  const db = await getDb();
  const { organizationId, status, search } = params;

  if (!db) {
    const all = Array.from(inMemoryServiceProjects.values())
      .filter((p) => p?.organizationId === organizationId)
      .filter((p) => (status ? p?.status === status : true))
      .filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return String(p?.title ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime());
    return all;
  }

  const conditions: any[] = [eq(serviceProjects.organizationId, organizationId)];
  if (status) conditions.push(eq(serviceProjects.status, status));
  if (search && search.trim()) {
    conditions.push(like(serviceProjects.title, `%${search.trim()}%`));
  }

  return db
    .select()
    .from(serviceProjects)
    .where(and(...conditions))
    .orderBy(desc(serviceProjects.updatedAt));
}

export async function createServiceProjectExpense(expense: InsertServiceProjectExpense) {
  const db = await getDb();
  if (!db) {
    const id = Date.now();
    inMemoryServiceProjectExpenses.set(id, {
      id,
      ...expense,
      createdAt: expense.createdAt ?? new Date(),
    });
    return id;
  }
  const result = await db.insert(serviceProjectExpenses).values(expense as any);
  return result[0].insertId;
}

export async function listServiceProjectExpenses(serviceProjectId: number) {
  const db = await getDb();
  if (!db) {
    return Array.from(inMemoryServiceProjectExpenses.values())
      .filter((e) => e?.serviceProjectId === serviceProjectId)
      .sort((a, b) => new Date(b.expenseDate ?? b.createdAt).getTime() - new Date(a.expenseDate ?? a.createdAt).getTime());
  }
  return db
    .select()
    .from(serviceProjectExpenses)
    .where(eq(serviceProjectExpenses.serviceProjectId, serviceProjectId))
    .orderBy(desc(serviceProjectExpenses.expenseDate));
}

export async function deleteServiceProjectExpense(id: number) {
  const db = await getDb();
  if (!db) {
    inMemoryServiceProjectExpenses.delete(id);
    return;
  }
  await db.delete(serviceProjectExpenses).where(eq(serviceProjectExpenses.id, id));
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

export async function getAllTasksForUser(userId: number, filters?: { status?: string; priority?: string }) {
  const db = await getDb();
  if (!db) return [];

  const owner = or(eq(tasks.assignedById, userId), eq(tasks.assignedToId, userId));
  const conditions: any[] = [owner];
  if (filters?.status) conditions.push(eq(tasks.status, filters.status as any));
  if (filters?.priority) conditions.push(eq(tasks.priority, filters.priority as any));

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return rows[0];
}

export async function getTaskByIdForUser(userId: number, id: number) {
  const task = await getTaskById(id);
  if (!task) return undefined;
  const ok =
    Number((task as any).assignedById) === userId || Number((task as any).assignedToId) === userId;
  if (!ok) return undefined;
  return task;
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

export async function getAllInvoicesForUser(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const base = eq(invoices.createdById, userId);
  if (status) {
    return db
      .select()
      .from(invoices)
      .where(and(base, eq(invoices.status, status as any)))
      .orderBy(desc(invoices.createdAt));
  }
  return db.select().from(invoices).where(base).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceByIdForUser(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.createdById, userId)))
    .limit(1);
  return rows[0];
}

export async function getInvoicesByClientIdForUser(userId: number, clientId: number) {
  const ownedClient = await getClientByIdForUser(userId, clientId);
  if (!ownedClient) return [];
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(invoices)
    .where(and(eq(invoices.clientId, clientId), eq(invoices.createdById, userId)))
    .orderBy(desc(invoices.createdAt));
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

export async function getInvoiceStatsForUser(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0, paidAmount: 0 };

  const allInvoices = await db.select().from(invoices).where(eq(invoices.createdById, userId));

  let total = 0,
    paid = 0,
    pending = 0,
    overdue = 0,
    totalAmount = 0,
    paidAmount = 0;

  allInvoices.forEach((inv) => {
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

export async function getPaymentsByInvoiceIdForUser(userId: number, invoiceId: number) {
  const invoice = await getInvoiceByIdForUser(userId, invoiceId);
  if (!invoice) return [];
  return getPaymentsByInvoiceId(invoiceId);
}

export async function getPaymentsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  const inv = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.clientId, clientId));
  const ids = inv.map((i) => i.id);
  if (ids.length === 0) return [];
  return db
    .select()
    .from(payments)
    .where(or(...ids.map((id) => eq(payments.invoiceId, id))))
    .orderBy(desc(payments.paidAt));
}

export async function getPaymentsByClientIdForUser(userId: number, clientId: number) {
  const ownedClient = await getClientByIdForUser(userId, clientId);
  if (!ownedClient) return [];

  const db = await getDb();
  if (!db) return [];

  const inv = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.clientId, clientId), eq(invoices.createdById, userId)));
  const ids = inv.map((i) => i.id);
  if (ids.length === 0) return [];
  return db
    .select()
    .from(payments)
    .where(or(...ids.map((id) => eq(payments.invoiceId, id))))
    .orderBy(desc(payments.paidAt));
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

export async function getCalendarEventsByDateRangeForUser(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.startTime, startDate),
        lte(calendarEvents.startTime, endDate)
      )
    )
    .orderBy(calendarEvents.startTime);
}

export async function getCalendarEventByIdForUser(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)))
    .limit(1);
  return rows[0];
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

export async function getCommunicationLogsByClientIdForUser(userId: number, clientId: number) {
  const ownedClient = await getClientByIdForUser(userId, clientId);
  if (!ownedClient) return [];
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(communicationLogs)
    .where(and(eq(communicationLogs.clientId, clientId), eq(communicationLogs.userId, userId)))
    .orderBy(desc(communicationLogs.contactedAt));
}

// ==================== AI CHAT HISTORY FUNCTIONS ====================
export async function createAiChatMessage(message: InsertAiChatHistory) {
  const db = await getDb();
  if (!db) {
    console.log("[DB] Using in-memory storage for AI chat message");
    // Use in-memory storage for local development
    const g = globalThis as any;
    const inMemoryMessages: any[] = g.aiChatMessages || (g.aiChatMessages = []);
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
    const g = globalThis as any;
    const inMemoryMessages: any[] = g.aiChatMessages || [];
    return inMemoryMessages
      .filter((msg: any) => msg.userId === userId && msg.sessionId === sessionId)
      .sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
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
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markNotificationAsReadForUser(userId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
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

export async function getTimeEntriesByCaseIdForUser(userId: number, caseId: number) {
  const ownedCase = await getCaseByIdForUser(userId, caseId);
  if (!ownedCase) return [];
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.caseId, caseId), eq(timeEntries.userId, userId)))
    .orderBy(desc(timeEntries.entryDate));
}

export async function getTimeEntriesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeEntries).where(eq(timeEntries.userId, userId)).orderBy(desc(timeEntries.entryDate));
}

export async function getReportsStats(range?: "week" | "month" | "quarter" | "year") {
  const db = await getDb();
  if (!db) {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalCases: 0,
      wonCases: 0,
      lostCases: 0,
      totalClients: 0,
      newClients: 0,
    };
  }

  const invoiceStats = await getInvoiceStats();
  const caseStats = await getCaseStats();
  const totalClients = await getClientCount();

  const now = new Date();
  const start = new Date(now);
  if (range === "week") start.setDate(now.getDate() - 7);
  else if (range === "month") start.setMonth(now.getMonth() - 1);
  else if (range === "quarter") start.setMonth(now.getMonth() - 3);
  else if (range === "year") start.setFullYear(now.getFullYear() - 1);
  else start.setMonth(now.getMonth() - 1);

  const newClientsResult = await db
    .select({ count: count() })
    .from(clients)
    .where(gte(clients.createdAt, start));

  const totalRevenue = invoiceStats.paidAmount;
  const totalExpenses = 0;
  const netProfit = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    totalCases: caseStats.total,
    wonCases: caseStats.won,
    lostCases: caseStats.lost,
    totalClients,
    newClients: newClientsResult[0]?.count ?? 0,
  };
}

export async function getReportsStatsForUser(userId: number, range?: "week" | "month" | "quarter" | "year") {
  const db = await getDb();
  if (!db) {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalCases: 0,
      wonCases: 0,
      lostCases: 0,
      totalClients: 0,
      newClients: 0,
    };
  }

  const invoiceStats = await getInvoiceStatsForUser(userId);
  const caseStats = await getCaseStatsForUser(userId);

  const totalClientsResult = await db
    .select({ count: count() })
    .from(clients)
    .where(eq(clients.createdById, userId));
  const totalClients = totalClientsResult[0]?.count ?? 0;

  const now = new Date();
  const start = new Date(now);
  if (range === "week") start.setDate(now.getDate() - 7);
  else if (range === "month") start.setMonth(now.getMonth() - 1);
  else if (range === "quarter") start.setMonth(now.getMonth() - 3);
  else if (range === "year") start.setFullYear(now.getFullYear() - 1);
  else start.setMonth(now.getMonth() - 1);

  const newClientsResult = await db
    .select({ count: count() })
    .from(clients)
    .where(and(eq(clients.createdById, userId), gte(clients.createdAt, start)));

  const totalRevenue = invoiceStats.paidAmount;
  const totalExpenses = 0;
  const netProfit = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    totalCases: caseStats.total,
    wonCases: caseStats.won,
    lostCases: caseStats.lost,
    totalClients,
    newClients: newClientsResult[0]?.count ?? 0,
  };
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
    wonCases: 0,
    lostCases: 0,
    pendingCases: 0,
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
    wonCases: caseStats.won,
    lostCases: caseStats.lost,
    pendingCases: caseStats.pending,
  };
}

export async function getDashboardStatsForUser(userId: number) {
  const db = await getDb();
  if (!db)
    return {
      totalCases: 0,
      activeCases: 0,
      totalClients: 0,
      upcomingHearings: 0,
      pendingTasks: 0,
      unpaidInvoices: 0,
      winRate: 0,
      totalRevenue: 0,
      wonCases: 0,
      lostCases: 0,
      pendingCases: 0,
    };

  const caseStats = await getCaseStatsForUser(userId);

  const clientCountResult = await db
    .select({ count: count() })
    .from(clients)
    .where(eq(clients.createdById, userId));
  const clientCount = clientCountResult[0]?.count ?? 0;

  const upcoming = await getUpcomingHearingsForUser(userId, 7);
  const pendingTasksResult = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.status, "pending"),
        or(eq(tasks.assignedById, userId), eq(tasks.assignedToId, userId))
      )
    );
  const invoiceStats = await getInvoiceStatsForUser(userId);

  const winRate =
    caseStats.total > 0
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
    wonCases: caseStats.won,
    lostCases: caseStats.lost,
    pendingCases: caseStats.pending,
  };
}
