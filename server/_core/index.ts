import "dotenv/config";
import express from "express";
import fs from "fs/promises";
import { createServer } from "http";
import net from "net";
import path from "path";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { firebaseWebConfig } from "./firebaseWebConfig";
import { sdk } from "./sdk";
import * as db from "../db";
import { storagePut } from "../storage";
import { startLegalCrawlerScheduler } from "../legalCrawler";
import { startDocumentRemindersScheduler } from "../documentReminders";
import { serveStatic, setupVite } from "./vite";
import { getFirebaseAdmin } from "./firebaseAdmin";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const OWNER_DASHBOARD_COOKIE = "owner_dashboard_session";
  const ownerDashboardSecretKey = new TextEncoder().encode(ENV.cookieSecret);

  const signOwnerDashboardSession = async () => {
    const expiresInDays = 30;
    const expirationSeconds = Math.floor((Date.now() + expiresInDays * 24 * 60 * 60 * 1000) / 1000);
    return new SignJWT({ t: "owner_dashboard" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(ownerDashboardSecretKey);
  };

  const verifyOwnerDashboardSession = async (cookieValue: string | undefined | null): Promise<boolean> => {
    if (!cookieValue) return false;
    try {
      const { payload } = await jwtVerify(cookieValue, ownerDashboardSecretKey, {
        algorithms: ["HS256"],
      });
      return (payload as any)?.t === "owner_dashboard";
    } catch {
      return false;
    }
  };

  const getCookieValue = (req: express.Request, name: string): string | null => {
    const header = req.headers.cookie;
    if (!header) return null;
    try {
      const parsed = parseCookieHeader(header);
      const v = (parsed as any)?.[name];
      return typeof v === "string" && v.trim() ? v : null;
    } catch {
      return null;
    }
  };

  const requireOwnerDashboard = async (req: express.Request, res: express.Response): Promise<boolean> => {
    if (!ENV.ownerOpenId || !ENV.ownerOpenId.trim()) {
      res.status(403).json({ success: false, message: "Owner is not configured" });
      return false;
    }
    const token = getCookieValue(req, OWNER_DASHBOARD_COOKIE);
    const ok = await verifyOwnerDashboardSession(token);
    if (!ok) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return false;
    }
    return true;
  };

  const ownerPublicDir = path.join(process.cwd(), "public", "owner");
  try {
    await fs.access(ownerPublicDir);

    app.get("/owner", (_req, res) => {
      res.redirect("/owner/index.html");
    });
    app.use("/owner", express.static(ownerPublicDir));
  } catch {
  }

  app.post("/api/owner/login", async (req, res) => {
    try {
      const configuredPassword = (process.env.OWNER_DASHBOARD_PASSWORD ?? "").trim();
      if (!configuredPassword) {
        return res.status(403).json({ success: false, message: "Owner dashboard password is not configured" });
      }

      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!password || password !== configuredPassword) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }

      const token = await signOwnerDashboardSession();
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(OWNER_DASHBOARD_COOKIE, token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  app.get("/api/owner/status", async (req, res) => {
    const isOwner = await verifyOwnerDashboardSession(getCookieValue(req, OWNER_DASHBOARD_COOKIE));
    return res.json({ isOwner });
  });

  app.post("/api/owner/logout", async (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(OWNER_DASHBOARD_COOKIE, { ...cookieOptions, maxAge: -1 });
    return res.json({ success: true });
  });

  app.get("/api/owner/overview", async (req, res) => {
    if (!(await requireOwnerDashboard(req, res))) return;

    const [users, organizations] = await Promise.all([db.getAllUsers(), db.getAllOrganizations()]);
    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.isActive).length;
    const totalOrganizations = organizations.length;

    const byPlan = {
      individual: 0,
      law_firm: 0,
      enterprise: 0,
    } as Record<"individual" | "law_firm" | "enterprise", number>;

    for (const u of users as any[]) {
      const plan = (u.subscriptionPlan ?? "individual") as "individual" | "law_firm" | "enterprise";
      byPlan[plan] = (byPlan[plan] ?? 0) + 1;
    }

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalOrganizations,
        usersByPlan: byPlan,
      },
    });
  });

  app.get("/api/owner/stats", async (req, res) => {
    if (!(await requireOwnerDashboard(req, res))) return;

    const rangeRaw = typeof req.query?.range === "string" ? req.query.range : "";
    const range = ["week", "month", "quarter", "year"].includes(rangeRaw) ? (rangeRaw as any) : undefined;

    const [users, organizations, caseStats, invoiceStats, reportsStats, dashboardStats] = await Promise.all([
      db.getAllUsers(),
      db.getAllOrganizations(),
      db.getCaseStats(),
      db.getInvoiceStats(),
      db.getReportsStats(range),
      db.getDashboardStats(),
    ]);

    return res.json({
      success: true,
      data: {
        users: {
          total: (users as any[]).length,
          active: (users as any[]).filter((u: any) => u.isActive).length,
        },
        organizations: {
          total: (organizations as any[]).length,
        },
        cases: caseStats,
        invoices: invoiceStats,
        reports: reportsStats,
        dashboard: dashboardStats,
      },
    });
  });

  app.get("/api/owner/users", async (req, res) => {
    if (!(await requireOwnerDashboard(req, res))) return;

    const [users, organizations] = await Promise.all([db.getAllUsers(), db.getAllOrganizations()]);
    const orgById = new Map<number, any>((organizations as any[]).map((o: any) => [Number(o.id), o]));

    const query = typeof req.query?.query === "string" ? req.query.query.trim().toLowerCase() : "";
    const role = typeof req.query?.role === "string" ? req.query.role : "";
    const isActiveRaw = typeof req.query?.isActive === "string" ? req.query.isActive : "";
    const isActive = isActiveRaw === "true" ? true : isActiveRaw === "false" ? false : null;

    let list = users as any[];
    if (role && ["admin", "lawyer", "assistant", "client"].includes(role)) {
      list = list.filter((u) => u.role === role);
    }
    if (typeof isActive === "boolean") {
      list = list.filter((u) => Boolean(u.isActive) === isActive);
    }
    if (query) {
      list = list.filter((u) => {
        const name = String(u.name ?? "").toLowerCase();
        const email = String(u.email ?? "").toLowerCase();
        const phone = String(u.phone ?? "").toLowerCase();
        const openId = String(u.openId ?? "").toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query) || openId.includes(query);
      });
    }

    const data = list.map((u) => {
      const orgId = u.organizationId ? Number(u.organizationId) : null;
      const org = orgId ? orgById.get(orgId) : null;
      return {
        ...u,
        organization: org ? { id: Number(org.id), name: org.name, subscriptionPlan: org.subscriptionPlan, seatLimit: org.seatLimit } : null,
      };
    });

    return res.json({ success: true, data });
  });

  app.post("/api/owner/users/:userId/active", async (req, res) => {
    if (!(await requireOwnerDashboard(req, res))) return;
    const userId = Number(req.params.userId);
    const isActive = Boolean(req.body?.isActive);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }
    await db.setUserActive(userId, isActive);
    return res.json({ success: true });
  });

  app.post("/api/owner/users/:userId/plan", async (req, res) => {
    if (!(await requireOwnerDashboard(req, res))) return;

    const userId = Number(req.params.userId);
    const plan = typeof req.body?.plan === "string" ? req.body.plan : "";
    const isActive = typeof req.body?.isActive === "boolean" ? req.body.isActive : undefined;

    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }
    if (!plan || !["individual", "law_firm", "enterprise"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const seatLimit = plan === "law_firm" ? 5 : plan === "enterprise" ? 15 : 1;
    const organizationId = await db.ensureUserHasOrganization({
      openId: user.openId,
      defaultOrganizationName: user.name ?? null,
    });

    await db.setOrganizationSubscriptionPlan({
      organizationId,
      subscriptionPlan: plan as any,
      seatLimit,
    });

    await db.setUserSubscriptionPlan({
      userId: user.id,
      subscriptionPlan: plan as any,
      accountType: plan as any,
      seatLimit,
    });

    if (typeof isActive === "boolean") {
      await db.setUserActive(user.id, isActive);
    }

    return res.json({ success: true });
  });

  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  app.use("/uploads", express.static(uploadsDir));

  // Basic CORS support for separate frontend origin (e.g. Netlify)
  const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [];
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;

    // Allow specific origins or localhost for development
    if (
      origin &&
      (allowedOrigins.includes(origin) ||
        origin.includes("localhost") ||
        origin.endsWith(".up.railway.app") ||
        origin.endsWith(".railway.internal"))
    ) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );

      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }
    }

    next();
  });

  app.get("/api/public/firebase-config", (req, res) => {
    try {
      const forwardedHostHeader = req.headers["x-forwarded-host"];
      const forwardedHost = Array.isArray(forwardedHostHeader)
        ? forwardedHostHeader[0]
        : forwardedHostHeader;

      const host =
        typeof forwardedHost === "string" && forwardedHost.trim()
          ? forwardedHost.trim().split(",")[0]!.trim().toLowerCase()
          : typeof req.hostname === "string"
            ? req.hostname.toLowerCase()
            : "";

      const shouldUseCustomAuthDomain =
        host === "mawazenco.com" || host === "www.mawazenco.com" || host.endsWith(".mawazenco.com");

      res.json({
        ...firebaseWebConfig,
        authDomain: shouldUseCustomAuthDomain ? "auth.mawazenco.com" : firebaseWebConfig.authDomain,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to load Firebase config" });
    }
  });

  app.post("/api/auth/firebase", async (req, res) => {
    try {
      const idToken = typeof req.body?.idToken === "string" ? req.body.idToken : "";
      if (!idToken) {
        return res.status(400).json({ success: false, message: "Missing idToken" });
      }

      const profileName = typeof req.body?.profile?.name === "string" ? req.body.profile.name.trim() : "";
      const profilePhone = typeof req.body?.profile?.phone === "string" ? req.body.profile.phone.trim() : "";
      const profileOrganizationName =
        typeof req.body?.profile?.organizationName === "string"
          ? req.body.profile.organizationName.trim()
          : "";

      const admin = getFirebaseAdmin();
      const decoded = await admin.auth().verifyIdToken(idToken);

      const uid = decoded.uid;
      const signInProvider = (decoded as any)?.firebase?.sign_in_provider as string | undefined;
      const loginMethod =
        signInProvider === "google.com"
          ? "google"
          : signInProvider === "password"
            ? "email"
            : signInProvider === "phone"
              ? "phone"
              : "firebase";
      const name =
        typeof (decoded as any)?.name === "string" && (decoded as any).name.trim()
          ? (decoded as any).name.trim()
          : profileName;
      const email = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : null;
      const emailVerified = (decoded as any)?.email_verified === true;
      const linkedPhone =
        typeof (decoded as any)?.phone_number === "string" && (decoded as any).phone_number.trim()
          ? (decoded as any).phone_number.trim()
          : null;
      const phone = linkedPhone || profilePhone || null;

      const openId = `firebase-${uid}`;
      const signedInAt = new Date();

      await db.upsertUser({
        openId,
        name: name || null,
        email,
        phone,
        loginMethod,
        lastSignedIn: signedInAt,
        isActive: true,
      });

      await db.ensureUserHasOrganization({
        openId,
        defaultOrganizationName: profileOrganizationName || name || null,
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        return res.status(500).json({ success: false, message: "Failed to create user" });
      }

      if (signInProvider === "password" && email && !emailVerified && !linkedPhone) {
        return res.status(403).json({
          success: false,
          code: "EMAIL_NOT_VERIFIED",
          message: "يجب تفعيل الحساب أولاً عبر البريد الإلكتروني أو رقم الجوال.",
        });
      }

      const token = await sdk.createSessionToken(openId, {
        name: user.name || name || "",
      });

      return res.json({
        success: true,
        data: {
          token,
          user,
        },
      });
    } catch (error) {
      console.error("[Auth] Firebase login failed", error);

      const errMessage = error instanceof Error ? error.message : "";
      if (errMessage === "PHONE_ALREADY_IN_USE") {
        return res.status(409).json({
          success: false,
          code: "PHONE_ALREADY_IN_USE",
          message: "هذا رقم الجوال مستخدم بالفعل. استخدم رقمًا آخر أو سجّل الدخول بالحساب المرتبط به.",
        });
      }
      if (errMessage === "EMAIL_ALREADY_IN_USE") {
        return res.status(409).json({
          success: false,
          code: "EMAIL_ALREADY_IN_USE",
          message: "هذا البريد الإلكتروني مستخدم بالفعل. سجّل الدخول بدل إنشاء حساب جديد.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Firebase authentication failed",
      });
    }
  });

  app.post("/api/documents/upload", async (req, res) => {
    try {
      await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const filename = typeof req.body?.filename === "string" ? req.body.filename : "file";
      const mimeType = typeof req.body?.mimeType === "string" ? req.body.mimeType : null;
      const dataBase64 = typeof req.body?.dataBase64 === "string" ? req.body.dataBase64 : "";

      if (!dataBase64) {
        return res.status(400).json({ error: "Missing file data" });
      }

      const buffer = Buffer.from(dataBase64, "base64");
      const maxSize = 10 * 1024 * 1024;
      if (buffer.length > maxSize) {
        return res.status(400).json({ error: "File too large" });
      }

      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storedName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`;

      try {
        const contentType = mimeType ?? "application/octet-stream";
        const { key, url } = await storagePut(`uploads/${storedName}`, buffer, contentType);
        return res.json({
          fileUrl: url,
          fileKey: key,
          mimeType,
          fileSize: buffer.length,
        });
      } catch {
        const filePath = path.join(uploadsDir, storedName);
        await fs.writeFile(filePath, buffer);

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        return res.json({
          fileUrl: `${baseUrl}/uploads/${storedName}`,
          fileKey: storedName,
          mimeType,
          fileSize: buffer.length,
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Upload failed" });
    }
  });
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  console.log("[Server] Setting up tRPC middleware...");
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  console.log("[Server] tRPC middleware configured");

  const crawler = startLegalCrawlerScheduler();
  if (crawler.started) {
    console.log(`[LegalCrawler] Scheduler started (intervalMinutes=${crawler.intervalMinutes})`);
  } else {
    console.log(`[LegalCrawler] Scheduler not started (${crawler.reason})`);
  }

  const docReminders = startDocumentRemindersScheduler();
  if (docReminders.started) {
    console.log(`[DocumentReminders] Scheduler started (intervalMinutes=${docReminders.intervalMinutes})`);
  } else {
    console.log(`[DocumentReminders] Scheduler not started (${docReminders.reason})`);
  }

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port =
    process.env.NODE_ENV === "production" ? preferredPort : await findAvailablePort(preferredPort);

  if (process.env.NODE_ENV !== "production" && port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
