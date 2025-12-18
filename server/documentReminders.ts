import { and, lte, or, sql } from "drizzle-orm";
import { documents } from "../drizzle/schema";
import { ENV } from "./_core/env";
import * as db from "./db";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runDocumentRemindersOnce() {
  if (!ENV.documentRemindersEnabled) {
    return { skipped: true as const, reason: "DOCUMENT_REMINDERS_ENABLED is not true" };
  }

  const database = await db.getDb();
  if (!database) {
    return { skipped: true as const, reason: "Database not available" };
  }

  const now = new Date();
  const scanFuture = new Date(now.getTime() + 365 * DAY_MS);

  const rows = await database
    .select()
    .from(documents)
    .where(
      or(
        and(sql`${documents.renewAt} IS NOT NULL`, lte(documents.renewAt, scanFuture)),
        and(sql`${documents.expiresAt} IS NOT NULL`, lte(documents.expiresAt, scanFuture))
      )
    );

  let sent = 0;
  for (const doc of rows as any[]) {
    const dueAt: Date | null = (doc.renewAt ?? doc.expiresAt) ? new Date(doc.renewAt ?? doc.expiresAt) : null;
    if (!dueAt) continue;

    const reminderDays = Number(doc.reminderDays ?? 30);
    const lastSent = doc.lastReminderSentAt ? new Date(doc.lastReminderSentAt) : null;

    // Avoid spamming: at most once per 24h
    if (lastSent && now.getTime() - lastSent.getTime() < DAY_MS) continue;

    const diffMs = dueAt.getTime() - now.getTime();
    const withinWindow = diffMs <= reminderDays * DAY_MS;

    // Only notify if within reminder window (or already overdue but never notified recently)
    if (!withinWindow && diffMs > 0) continue;

    const userId = doc.uploadedById;
    if (!userId) continue;

    const isRenew = Boolean(doc.renewAt);
    const dueLabel = isRenew ? "تجديد" : "انتهاء";
    const dueDateStr = dueAt.toLocaleDateString("ar-SA");

    await db.createNotification({
      userId,
      title: "تنبيه مستند",
      message: `المستند "${doc.name}" اقترب موعد ${dueLabel}ه بتاريخ ${dueDateStr}.`,
      type: "system",
      isRead: false,
      relatedCaseId: doc.caseId ?? null,
      relatedInvoiceId: null,
      createdAt: now,
    } as any);

    await db.updateDocument(doc.id, { lastReminderSentAt: now } as any);
    sent++;
  }

  return { skipped: false as const, scanned: rows.length, sent };
}

export function startDocumentRemindersScheduler() {
  if (!ENV.documentRemindersEnabled) {
    return { started: false as const, reason: "DOCUMENT_REMINDERS_ENABLED is not true" };
  }

  const intervalMinutes = ENV.documentRemindersIntervalMinutes;
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    return { started: false as const, reason: "DOCUMENT_REMINDERS_INTERVAL_MINUTES is invalid" };
  }

  const run = async () => {
    try {
      const res = await runDocumentRemindersOnce();
      if (!(res as any).skipped) {
        console.log(`[DocumentReminders] scanned=${(res as any).scanned} sent=${(res as any).sent}`);
      } else {
        console.log(`[DocumentReminders] skipped: ${(res as any).reason}`);
      }
    } catch (e) {
      console.warn("[DocumentReminders] run failed", e);
    }
  };

  // Run once on start
  void run();

  const timer = setInterval(run, intervalMinutes * 60 * 1000);
  // Don't keep process alive solely for this interval
  (timer as any).unref?.();

  return { started: true as const, intervalMinutes };
}
