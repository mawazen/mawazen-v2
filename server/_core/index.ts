import "dotenv/config";
import express from "express";
import fs from "fs/promises";
import { createServer } from "http";
import net from "net";
import path from "path";
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
