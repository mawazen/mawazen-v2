import { createHash } from "crypto";
import { ENV } from "./_core/env";
import * as db from "./db";
import { embedTexts } from "./legalEmbeddings";

type CrawlPageResult = {
  url: string;
  status: number | null;
  title: string | null;
  text: string;
  rawBody: string;
  etag: string | null;
  lastModified: string | null;
  error: string | null;
};

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function extractLinksFromHtml(html: string, baseUrl: string): string[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }

  const hrefs = Array.from(html.matchAll(/href\s*=\s*"([^"]+)"/gi)).map((m) => m[1]);
  const out: string[] = [];

  for (const href of hrefs) {
    const h = (href ?? "").trim();
    if (!h) continue;
    if (h.startsWith("#")) continue;
    if (h.startsWith("javascript:")) continue;
    if (h.startsWith("mailto:")) continue;

    try {
      const u = new URL(h, base);
      if (u.protocol !== "http:" && u.protocol !== "https:") continue;
      // Only keep same host
      if (u.hostname !== base.hostname) continue;

      // Respect common disallows for laws.boe.gov.sa
      if (u.pathname.startsWith("/Identity/")) continue;
      if (u.pathname.startsWith("/admin/")) continue;

      out.push(u.toString());
    } catch {
      continue;
    }
  }

  return Array.from(new Set(out));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(html: string) {
  // Very lightweight HTML -> text. MVP only.
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withNewlines = withoutScripts
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/?p\s*>/gi, "\n")
    .replace(/<\s*\/?div\s*>/gi, "\n")
    .replace(/<\s*\/?li\s*>/gi, "\n");
  const text = withNewlines.replace(/<[^>]+>/g, " ");
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[\t\r]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

function extractTitle(html: string) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return stripHtml(m[1]).trim() || null;
}

function inferSource(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("laws.moj.gov.sa")) return "MOJ_LAWS";
    if (host.includes("boe.gov.sa")) return "BOE";
    if (host.includes("cma.org.sa")) return "CMA";
    if (host.includes("cma.gov.sa")) return "CMA";
    if (host.includes("sama.gov.sa")) return "SAMA";
    if (host.includes("zatca.gov.sa")) return "ZATCA";
    if (host.includes("expro.gov.sa")) return "EXPRO";
    if (host.includes("nazaha.gov.sa")) return "NAZAHA";
    return host;
  } catch {
    return "UNKNOWN";
  }
}

async function fetchText(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers, redirect: "follow" });
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  return { res, contentType, text };
}

async function parseSitemapXml(xml: string): Promise<string[]> {
  // Supports sitemapindex and urlset (basic)
  const locs = Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)).map((m) => m[1].trim());
  return locs.filter(Boolean);
}

function chunkText(text: string, opts?: { maxChars?: number; overlapChars?: number }) {
  const maxChars = opts?.maxChars ?? 1200;
  const overlapChars = opts?.overlapChars ?? 150;

  const clean = text.replace(/\s{2,}/g, " ").trim();
  if (!clean) return [] as string[];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + maxChars, clean.length);
    const slice = clean.slice(start, end).trim();
    if (slice.length > 0) chunks.push(slice);
    if (end >= clean.length) break;
    start = Math.max(0, end - overlapChars);
  }
  return chunks;
}

async function crawlSingleUrl(url: string): Promise<CrawlPageResult> {
  const headers: Record<string, string> = {
    "user-agent": ENV.legalCrawlerUserAgent,
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  try {
    const { res, contentType, text } = await fetchText(url, headers);
    const rawBody = text;
    const etag = res.headers.get("etag");
    const lastModified = res.headers.get("last-modified");

    if (!res.ok) {
      return {
        url,
        status: res.status,
        title: null,
        text: "",
        rawBody,
        etag,
        lastModified,
        error: `HTTP ${res.status} ${res.statusText}`,
      };
    }

    // Handle XML sitemaps defensively (keep raw XML so we can parse <loc>)
    if (
      (contentType.includes("xml") || rawBody.trim().startsWith("<?xml") || rawBody.includes("<urlset") || rawBody.includes("<sitemapindex")) &&
      rawBody.includes("<loc>")
    ) {
      return {
        url,
        status: res.status,
        title: null,
        text: rawBody,
        rawBody,
        etag,
        lastModified,
        error: null,
      };
    }

    const title = extractTitle(rawBody);
    const plain = stripHtml(rawBody);
    return {
      url,
      status: res.status,
      title,
      text: plain,
      rawBody,
      etag,
      lastModified,
      error: null,
    };
  } catch (e: any) {
    return {
      url,
      status: null,
      title: null,
      text: "",
      rawBody: "",
      etag: null,
      lastModified: null,
      error: e?.message ?? String(e),
    };
  }
}

export async function runLegalCrawlerOnce(params?: { seedSitemaps?: string[]; force?: boolean }) {
  if (!ENV.legalCrawlerEnabled && !params?.force) {
    return { skipped: true as const, reason: "LEGAL_CRAWLER_ENABLED is not true" };
  }

  const seedSitemaps =
    params?.seedSitemaps && params.seedSitemaps.length > 0
      ? params.seedSitemaps
      : ENV.legalCrawlerSeedSitemaps;

  const effectiveSeeds =
    seedSitemaps && seedSitemaps.length > 0
      ? seedSitemaps
      : ["https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/08381293-6388-48e2-8ad2-a9a700f2aa94/1"];

  const embeddingsEnabled = !!(ENV.openaiApiKey && ENV.openaiApiKey.trim().length > 0);

  const runId = await db.createLegalCrawlerRun({
    status: "running",
    pagesCrawled: 0,
    documentsUpdated: 0,
  } as any);

  let pagesCrawled = 0;
  let documentsUpdated = 0;

  try {
    const discoveredUrls: string[] = [];
    for (const sitemapUrl of effectiveSeeds) {
      if (discoveredUrls.length >= ENV.legalCrawlerMaxPagesPerRun) break;
      const page = await crawlSingleUrl(sitemapUrl);
      await sleep(500);

      if (!page.text) continue;

      // If sitemap is XML, parse it.
      const raw = page.rawBody ?? page.text;
      const urls = await parseSitemapXml(raw);
      for (const u of urls) {
        if (discoveredUrls.length >= ENV.legalCrawlerMaxPagesPerRun) break;
        if (!discoveredUrls.includes(u)) discoveredUrls.push(u);
      }

      // If this seed isn't a sitemap, treat it as a direct seed URL and discover links from it.
      if (urls.length === 0) {
        if (!discoveredUrls.includes(sitemapUrl)) discoveredUrls.push(sitemapUrl);

        const links = extractLinksFromHtml(raw, sitemapUrl);
        for (const u of links) {
          if (discoveredUrls.length >= ENV.legalCrawlerMaxPagesPerRun) break;
          if (!discoveredUrls.includes(u)) discoveredUrls.push(u);
        }
      }

      // If it was a sitemapindex, parse nested sitemaps (one level)
      if (raw.includes("<sitemapindex") && urls.length > 0) {
        for (const nested of urls.slice(0, 5)) {
          if (discoveredUrls.length >= ENV.legalCrawlerMaxPagesPerRun) break;
          const nestedRes = await crawlSingleUrl(nested);
          await sleep(500);
          const nestedUrls = await parseSitemapXml(nestedRes.rawBody ?? nestedRes.text);
          for (const u of nestedUrls) {
            if (discoveredUrls.length >= ENV.legalCrawlerMaxPagesPerRun) break;
            if (!discoveredUrls.includes(u)) discoveredUrls.push(u);
          }
        }
      }
    }

    for (const url of discoveredUrls.slice(0, ENV.legalCrawlerMaxPagesPerRun)) {
      const result = await crawlSingleUrl(url);
      pagesCrawled += 1;

      const source = inferSource(url);
      const contentHash = result.text ? sha256Hex(result.text) : null;

      const raw = (result.rawBody ?? result.text ?? "").trim();
      const isSitemapXml =
        /sitemap/i.test(url) &&
        (raw.startsWith("<?xml") || raw.includes("<urlset") || raw.includes("<sitemapindex")) &&
        raw.includes("<loc>");

      const existing = await db.getLegalSourceDocumentBySourceUrl({ source, url });
      if (existing?.contentHash && contentHash && existing.contentHash === contentHash) {
        // No change
        await db.upsertLegalSourceDocument({
          source,
          url,
          title: result.title,
          contentText: isSitemapXml ? null : existing.contentText ?? result.text,
          contentHash: isSitemapXml ? null : contentHash,
          httpStatus: result.status ?? null,
          etag: result.etag,
          lastModified: result.lastModified,
          fetchedAt: new Date(),
          status: "skipped",
          error: null,
        } as any);
        await sleep(800);
        continue;
      }

      const docId = await db.upsertLegalSourceDocument({
        source,
        url,
        title: result.title,
        contentText: isSitemapXml ? null : result.text,
        contentHash: isSitemapXml ? null : contentHash,
        httpStatus: result.status ?? null,
        etag: result.etag,
        lastModified: result.lastModified,
        fetchedAt: new Date(),
        status: isSitemapXml ? "skipped" : result.error ? "error" : "ok",
        error: isSitemapXml ? null : result.error,
      } as any);

      if (!isSitemapXml && !result.error && result.text && result.text.length > 100) {
        const chunks = chunkText(result.text);
        let embeddings: number[][] | null = null;
        if (embeddingsEnabled) {
          // Embed in batches
          embeddings = [];
          const batchSize = 32;
          for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const vecs = await embedTexts(batch);
            embeddings.push(...vecs);
            await sleep(300);
          }
        }

        const rows = chunks.map((t, idx) => ({
          chunkIndex: idx,
          text: t,
          embeddingJson: embeddings ? JSON.stringify(embeddings[idx] ?? []) : null,
          metaJson: JSON.stringify({
            source,
            url,
            title: result.title,
          }),
        }));

        await db.replaceLegalChunksForDocument({
          documentId: docId,
          chunks: rows as any,
        });

        documentsUpdated += 1;
      } else {
        await db.replaceLegalChunksForDocument({ documentId: docId, chunks: [] });
      }

      await sleep(800);
    }

    await db.finishLegalCrawlerRun({
      id: runId,
      status: "success",
      pagesCrawled,
      documentsUpdated,
      error: null,
    });

    return { skipped: false as const, runId, pagesCrawled, documentsUpdated };
  } catch (e: any) {
    await db.finishLegalCrawlerRun({
      id: runId,
      status: "error",
      pagesCrawled,
      documentsUpdated,
      error: e?.message ?? String(e),
    });

    return { skipped: false as const, runId, pagesCrawled, documentsUpdated, error: e?.message ?? String(e) };
  }
}

export function startLegalCrawlerScheduler() {
  if (!ENV.legalCrawlerEnabled) {
    return { started: false as const, reason: "LEGAL_CRAWLER_ENABLED is not true" };
  }

  const intervalMinutes = Number.isFinite(ENV.legalCrawlerIntervalMinutes) && ENV.legalCrawlerIntervalMinutes > 0 ? ENV.legalCrawlerIntervalMinutes : 180;
  const intervalMs = intervalMinutes * 60_000;

  // Fire and forget; do not block server start
  setTimeout(() => {
    runLegalCrawlerOnce().catch((e) => console.warn("[LegalCrawler] initial run failed", e));
  }, 10_000);

  setInterval(() => {
    runLegalCrawlerOnce().catch((e) => console.warn("[LegalCrawler] scheduled run failed", e));
  }, intervalMs);

  return { started: true as const, intervalMinutes };
}
