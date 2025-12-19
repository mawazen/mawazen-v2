import { nanoid } from "nanoid";
import * as db from "../server/db";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Please set it in your environment before running this script.");
  }

  const frontendUrl = (process.env.FRONTEND_URL || "https://mawazen.netlify.app").replace(/\/+$/, "");

  const token = nanoid(40);

  const clientName = `Smoke Client ${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;
  const clientId = await db.createClient({
    name: clientName,
    type: "individual" as any,
    email: `smoke-${nanoid(8)}@example.com`,
    phone: null,
    createdById: null,
    portalEnabled: true,
    portalToken: token,
  } as any);

  const caseId = await db.createCase({
    clientId,
    caseNumber: `SMOKE-${nanoid(10).toUpperCase()}`,
    title: "Smoke Test Case",
    type: "other" as any,
    status: "active" as any,
    priority: "medium" as any,
    stage: "intake" as any,
  } as any);

  const documentId = await db.createDocument({
    name: "Smoke Shared Document",
    description: "Created by scripts/portal-smoke.ts",
    type: "other" as any,
    fileUrl: "https://example.com/smoke-document.pdf",
    fileKey: `smoke/${nanoid(16)}.pdf`,
    mimeType: "application/pdf",
    fileSize: 12345,
    caseId,
    clientId,
    isTemplate: false,
    isSharedWithClient: true,
  } as any);

  const invoiceNumber = `INV-SMOKE-${nanoid(10).toUpperCase()}`;
  const invoiceId = await db.createInvoice({
    invoiceNumber,
    clientId,
    caseId,
    amount: 1000,
    taxAmount: 0,
    totalAmount: 1000,
    currency: "SAR",
    status: "sent" as any,
    feeType: "fixed" as any,
    description: "Smoke test invoice",
  } as any);

  const paymentId = await db.createPayment({
    invoiceId,
    amount: 1000,
    currency: "SAR",
    method: "bank_transfer" as any,
    transactionId: `SMOKE-${nanoid(12)}`,
    notes: "Smoke test payment",
  } as any);

  const portalUrl = `${frontendUrl}/portal/${token}`;

  process.stdout.write(
    JSON.stringify(
      {
        clientId,
        caseId,
        documentId,
        invoiceId,
        paymentId,
        portalToken: token,
        portalUrl,
      },
      null,
      2
    ) + "\n"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
