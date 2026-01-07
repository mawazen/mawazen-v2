import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  console.log("[Context] Creating context for path:", opts.req.path);
  let user: User | null = null;

  const authHeader = opts.req.headers.authorization;
  const hasBearer = typeof authHeader === "string" && authHeader.startsWith("Bearer ");
  const cookieHeader = opts.req.headers.cookie;
  const hasSessionCookie =
    typeof cookieHeader === "string" && cookieHeader.includes(`${COOKIE_NAME}=`);

  if (!hasBearer && !hasSessionCookie) {
    console.log("[Context] Context created with user:", false);
    return {
      req: opts.req,
      res: opts.res,
      user: null,
    };
  }

  try {
    console.log("[Context] Authenticating request...");
    user = await sdk.authenticateRequest(opts.req);
    console.log("[Context] Authentication successful, user ID:", user?.id);
  } catch (error) {
    // Authentication is optional for public procedures.
    console.log(
      "[Context] Authentication failed:",
      error instanceof Error ? error.message : String(error)
    );
    user = null;
  }

  console.log("[Context] Context created with user:", !!user);
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
