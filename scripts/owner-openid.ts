import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as db from "../server/db";

type UserRow = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "admin" | "lawyer" | "assistant" | "client";
  isActive: boolean;
  createdAt: Date;
  lastSignedIn: Date;
};

function toEpochMs(value: unknown): number {
  if (!value) return 0;
  const d = value instanceof Date ? value : new Date(String(value));
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function isValidMysqlUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "mysql:" && url.protocol !== "mysql2:") return false;
    if (!url.hostname) return false;
    if (!url.pathname || url.pathname === "/") return false;

    // Filter obvious placeholders from templates
    const lowered = value.toLowerCase();
    if (lowered.includes("username:password@host:port")) return false;
    if (url.username === "username") return false;
    if (url.password === "password") return false;
    if (url.hostname === "host") return false;
    if (url.port === "port") return false;

    return true;
  } catch {
    return false;
  }
}

function loadEnvFromPathIfPresent(envPath: string) {
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  const parsed = dotenv.parse(raw);

  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key]) continue;

    if (key === "DATABASE_URL" && !isValidMysqlUrl(String(value))) {
      continue;
    }

    process.env[key] = String(value);
  }
}

function upsertEnvLine(params: { filePath: string; key: string; value: string }) {
  const { filePath, key, value } = params;
  const line = `${key}=${value}`;
  const content = fs.readFileSync(filePath, "utf8");
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);

  let replaced = false;
  const updated = lines.map((l) => {
    if (l.startsWith(`${key}=`)) {
      replaced = true;
      return line;
    }
    return l;
  });

  if (!replaced) {
    if (updated.length && updated[updated.length - 1].trim() !== "") {
      updated.push(line);
    } else {
      updated[updated.length - 1] = line;
    }
  }

  fs.writeFileSync(filePath, updated.join(eol) + eol, "utf8");
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "..");
  const envPath = path.join(repoRoot, ".env");

  loadEnvFromPathIfPresent(envPath);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !isValidMysqlUrl(databaseUrl)) {
    throw new Error(
      `DATABASE_URL is missing or invalid.\n` +
        `- If you already have a real DATABASE_URL, export it in your shell or put it in ${envPath}\n` +
        `- Your .env may contain a placeholder DATABASE_URL like mysql://username:password@host:port/database which is ignored by this script.`
    );
  }

  const users = (await db.getAllUsers()) as unknown as UserRow[];
  if (!users?.length) {
    throw new Error(
      "No users found. Make sure DATABASE_URL points to the correct database and that users exist."
    );
  }

  const admins = users.filter((u) => u.role === "admin");
  const candidates = (admins.length ? admins : users)
    .slice()
    .sort((a, b) => {
      const byLast = toEpochMs(b.lastSignedIn) - toEpochMs(a.lastSignedIn);
      if (byLast !== 0) return byLast;
      return toEpochMs(b.createdAt) - toEpochMs(a.createdAt);
    });

  const selected = candidates[0];
  if (!selected?.openId) {
    throw new Error("Failed to determine OWNER_OPEN_ID");
  }

  const wroteEnv = fs.existsSync(envPath);
  if (wroteEnv) {
    upsertEnvLine({ filePath: envPath, key: "OWNER_OPEN_ID", value: selected.openId });
  }

  const output = {
    ownerOpenId: selected.openId,
    selectedUser: {
      id: selected.id,
      name: selected.name,
      email: selected.email,
      role: selected.role,
      isActive: selected.isActive,
      lastSignedIn: selected.lastSignedIn,
      createdAt: selected.createdAt,
    },
    command: `OWNER_OPEN_ID=${selected.openId}`,
    wroteToDotEnv: wroteEnv,
    note:
      admins.length > 0
        ? "Selected most recently signed-in admin user"
        : "No admin users found; selected most recently signed-in user",
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
