import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Local login form for development
  app.get("/api/local-login", (req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Local Login - Development</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
          .form-group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; }
          input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
          button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <h2>Local Login (Development)</h2>
        <form method="post" action="/api/local-login">
          <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" value="Test User" required>
          </div>
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" value="test@example.com" required>
          </div>
          <button type="submit">Login</button>
        </form>
        <p><small>This is a development login form for local testing.</small></p>
      </body>
      </html>
    `);
  });

  // Handle local login POST
  app.post("/api/local-login", async (req: Request, res: Response) => {
    console.log("[Local Login] Processing local login");
    
    try {
      const name = req.body.name || "Test User";
      const email = req.body.email || "test@example.com";
      const openId = `local-${email.replace(/[^a-zA-Z0-9]/g, '')}`;

      const testUserInfo = {
        openId,
        name,
        email,
        loginMethod: "local"
      };

      await db.upsertUser({
        openId: testUserInfo.openId,
        name: testUserInfo.name,
        email: testUserInfo.email,
        loginMethod: testUserInfo.loginMethod,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(testUserInfo.openId, {
        name: testUserInfo.name,
        expiresInMs: ONE_YEAR_MS,
      });
      console.log("[Local Login] Session token created, length:", sessionToken.length);

      const cookieOptions = getSessionCookieOptions(req);
      console.log("[Local Login] Setting cookie with options:", cookieOptions);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[Local Login] Cookie set, redirecting to /");

      res.redirect(302, "/");
    } catch (error) {
      console.error("[Local Login] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Test endpoint for debugging cookie setting
  app.get("/api/test-login", async (req: Request, res: Response) => {
    console.log("[Test] Creating test session");
    
    try {
      const testUserInfo = {
        openId: "test-user-123",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "test"
      };

      await db.upsertUser({
        openId: testUserInfo.openId,
        name: testUserInfo.name,
        email: testUserInfo.email,
        loginMethod: testUserInfo.loginMethod,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(testUserInfo.openId, {
        name: testUserInfo.name,
        expiresInMs: ONE_YEAR_MS,
      });
      console.log("[Test] Session token created, length:", sessionToken.length);

      const cookieOptions = getSessionCookieOptions(req);
      console.log("[Test] Setting cookie with options:", cookieOptions);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[Test] Cookie set, redirecting to /");

      res.redirect(302, "/");
    } catch (error) {
      console.error("[Test] Test login failed", error);
      res.status(500).json({ error: "Test login failed" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    console.log("[OAuth] Callback received");
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      console.error("[OAuth] Missing code or state");
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      console.log("[OAuth] Exchanging code for token");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        console.error("[OAuth] openId missing from user info");
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      console.log("[OAuth] User info:", { openId: userInfo.openId, name: userInfo.name });
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      console.log("[OAuth] Creating session token");
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      console.log("[OAuth] Session token created, length:", sessionToken.length);

      const cookieOptions = getSessionCookieOptions(req);
      console.log("[OAuth] Setting cookie with options:", cookieOptions);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[OAuth] Cookie set, redirecting to /");

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
