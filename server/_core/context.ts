import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
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

  try {
    console.log("[Context] Authenticating request...");
    user = await sdk.authenticateRequest(opts.req);
    console.log("[Context] Authentication successful, user ID:", user?.id);
  } catch (error) {
    // Authentication is optional for public procedures.
    console.log("[Context] Authentication failed:", error.message);
    user = null;
  }

  console.log("[Context] Context created with user:", !!user);
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
