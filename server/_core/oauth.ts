import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";


export function registerOAuthRoutes(app: Express) {
  // Simple login form for all environments
  app.get("/api/local-login", (req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تسجيل الدخول - قيد</title>
        <style>
          body { 
            font-family: 'Tajawal', 'Cairo', Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin: 0; 
            padding: 20px;
          }
          .login-container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
            font-size: 32px;
            font-weight: bold;
            color: #D4AF37;
          }
          .form-group { margin-bottom: 20px; }
          label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 500;
            color: #333;
          }
          input { 
            width: 100%; 
            padding: 12px 16px; 
            border: 2px solid #e1e5e9; 
            border-radius: 8px; 
            font-size: 16px;
            transition: border-color 0.3s;
          }
          input:focus {
            outline: none;
            border-color: #D4AF37;
          }
          button { 
            background: linear-gradient(135deg, #D4AF37, #B8941F); 
            color: white; 
            padding: 14px 24px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px;
            font-weight: 600;
            width: 100%;
            transition: transform 0.2s;
          }
          button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3);
          }
          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
        <div class="login-container">
          <div class="logo">قيد</div>
          <p class="subtitle">المساعد القانوني الذكي</p>
          <form method="post" action="/api/local-login">
            <div class="form-group">
              <label for="name">الاسم:</label>
              <input type="text" id="name" name="name" value="مستخدم تجريبي" required>
            </div>
            <div class="form-group">
              <label for="email">البريد الإلكتروني:</label>
              <input type="email" id="email" name="email" value="test@example.com" required>
            </div>
            <button type="submit">تسجيل الدخول</button>
          </form>
        </div>
      </body>
      </html>
    `);
  });

  // Handle local login POST
  app.post("/api/local-login", async (req: Request, res: Response) => {
    console.log("[Local Login] Processing local login");
    
    try {
      const name = req.body.name || "مستخدم تجريبي";
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
      console.log("[Local Login] Cookie set, redirecting to frontend");

      // Redirect to frontend (Netlify) instead of local root
      const frontendOrigin = process.env.FRONTEND_URL || "https://qaid.netlify.app";
      res.redirect(302, frontendOrigin);
    } catch (error) {
      console.error("[Local Login] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
