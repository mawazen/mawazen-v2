import * as db from "./db";
import { ENV } from "./_core/env";
import { embedText } from "./legalEmbeddings";

export type RetrievedLegalSnippet = {
  text: string;
  score: number;
  source: string;
  url: string;
  title: string | null;
  meta: Record<string, unknown> | null;
};

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.trim().length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function dot(a: number[], b: number[]) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

function norm(a: number[]) {
  return Math.sqrt(dot(a, a));
}

function cosineSimilarity(a: number[], b: number[]) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  return dot(a, b) / (na * nb);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractArticleNumber(query: string): number | null {
  const m = String(query ?? "").match(/\b(?:المادة|ماده|مادة)\s*(\d{1,4})\b/);
  if (!m?.[1]) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function ordinalUnder100(n: number): string | null {
  if (!Number.isFinite(n) || n <= 0 || n >= 100) return null;
  const units: Record<number, string> = {
    1: "الأولى",
    2: "الثانية",
    3: "الثالثة",
    4: "الرابعة",
    5: "الخامسة",
    6: "السادسة",
    7: "السابعة",
    8: "الثامنة",
    9: "التاسعة",
  };

  if (n <= 9) return units[n] ?? null;
  if (n === 10) return "العاشرة";
  if (n >= 11 && n <= 19) {
    const u = n - 10;
    const teenUnits: Record<number, string> = {
      1: "الحادية عشرة",
      2: "الثانية عشرة",
      3: "الثالثة عشرة",
      4: "الرابعة عشرة",
      5: "الخامسة عشرة",
      6: "السادسة عشرة",
      7: "السابعة عشرة",
      8: "الثامنة عشرة",
      9: "التاسعة عشرة",
    };
    return teenUnits[u] ?? null;
  }

  const tensBase: Record<number, string> = {
    20: "العشرون",
    30: "الثلاثون",
    40: "الأربعون",
    50: "الخمسون",
    60: "الستون",
    70: "السبعون",
    80: "الثمانون",
    90: "التسعون",
  };

  const t = Math.floor(n / 10) * 10;
  const u = n % 10;
  if (u === 0) return tensBase[t] ?? null;

  const prefix: Record<number, string> = {
    1: "الحادية",
    2: "الثانية",
    3: "الثالثة",
    4: "الرابعة",
    5: "الخامسة",
    6: "السادسة",
    7: "السابعة",
    8: "الثامنة",
    9: "التاسعة",
  };

  const p = prefix[u];
  const tb = tensBase[t];
  if (!p || !tb) return null;
  return `${p} و${tb}`.replace(" و", " و");
}

function articleLabelBoeStyle(n: number): string | null {
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n === 100) return "المائة";
  if (n > 100 && n < 200) {
    const under = ordinalUnder100(n - 100);
    if (!under) return null;
    return `${under} بعد المائة`;
  }
  return null;
}

function buildKeywordTerms(query: string): string[] {
  const q = String(query ?? "").trim();
  const terms: string[] = [];

  const n = extractArticleNumber(q);
  if (n !== null) {
    terms.push(String(n));
    terms.push(`المادة ${n}`);
    const boe = articleLabelBoeStyle(n);
    if (boe) terms.push(`المادة ${boe}`);
  }

  if (/مكتب\s*العمل/.test(q) && !/نظام\s*العمل/.test(q)) {
    terms.push("نظام العمل");
  }

  // Keep a few informative tokens as generic fallback.
  const tokens = q
    .replace(/[\u200f\u200e]/g, " ")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .slice(0, 8);
  terms.push(...tokens);

  return Array.from(new Set(terms));
}

function scoreTextByTerms(text: string, terms: string[]) {
  const t = String(text ?? "");
  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    if (t.includes(term)) score += 1;
  }
  return score;
}

async function fetchBoeLaborArticleSnippet(params: { articleNumber: number }): Promise<RetrievedLegalSnippet | null> {
  // Minimal on-demand fallback when DB is empty.
  const boeLabel = articleLabelBoeStyle(params.articleNumber);
  if (!boeLabel) return null;

  const url = "https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/08381293-6388-48e2-8ad2-a9a700f2aa94/1";
  try {
    const res = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": ENV.legalCrawlerUserAgent,
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const plain = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\s*\/?p\s*>/gi, "\n")
      .replace(/<\s*\/?div\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
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

    const heading = `المادة ${boeLabel}`;
    const idx = plain.indexOf(heading);
    if (idx < 0) return null;
    const tail = plain.slice(idx);
    const nextIdx = tail.slice(heading.length).search(/\n\s*المادة\s+/);
    const end = nextIdx >= 0 ? heading.length + nextIdx : Math.min(tail.length, 1600);
    const snippetText = tail.slice(0, Math.min(end, 1600)).trim();
    if (snippetText.length < 40) return null;

    return {
      text: snippetText,
      score: 0.95,
      source: "BOE",
      url,
      title: "نظام العمل",
      meta: { law: "labor_law", article: params.articleNumber },
    };
  } catch {
    return null;
  }
}

export async function retrieveLegalSnippets(params: {
  query: string;
  topK?: number;
  scanLimit?: number;
}): Promise<RetrievedLegalSnippet[]> {
  const topK = params.topK ?? 6;
  const scanLimit = params.scanLimit ?? 400;

  const terms = buildKeywordTerms(params.query);

  // 1) Vector retrieval (if embeddings are available)
  if (ENV.openaiApiKey && ENV.openaiApiKey.trim().length > 0) {
    try {
      const queryVector = await embedText(params.query);
      if (queryVector.length) {
        const rows: any[] = (await db.listLegalChunksWithEmbeddings({ limit: scanLimit })) as any[];
        const scored: RetrievedLegalSnippet[] = rows
          .map((r) => {
            const embedding = safeJsonParse<number[]>(r.embeddingJson, []);
            const score = cosineSimilarity(queryVector, embedding);
            const meta = safeJsonParse<Record<string, unknown> | null>(r.metaJson, null);

            return {
              text: String(r.text ?? ""),
              score,
              source: String((r.source ?? (r.document?.source ?? "")) as any),
              url: String((r.url ?? (r.document?.url ?? "")) as any),
              title: (r.title ?? (r.document?.title ?? null)) as string | null,
              meta,
            };
          })
          .filter((x) => x.text.trim().length > 0 && x.url.trim().length > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);

        if (scored.length > 0 && scored[0]!.score >= 0.2) {
          return scored;
        }
      }
    } catch {
      // Fall through to keyword search
    }
  }

  // 2) Keyword retrieval (works with or without embeddings)
  try {
    const rows: any[] = (await db.listLegalChunksByTextSearch({ terms, limit: Math.max(scanLimit, topK * 10) })) as any[];
    const scored = rows
      .map((r) => {
        const meta = safeJsonParse<Record<string, unknown> | null>(r.metaJson, null);
        const score = scoreTextByTerms(String(r.text ?? ""), terms);
        return {
          text: String(r.text ?? ""),
          score,
          source: String(r.source ?? ""),
          url: String(r.url ?? ""),
          title: (r.title ?? null) as string | null,
          meta,
        } as RetrievedLegalSnippet;
      })
      .filter((x) => x.text.trim().length > 0 && x.url.trim().length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    if (scored.length > 0) return scored;
  } catch {
    // ignore
  }

  // 3) On-demand BOE fallback for نظام العمل when the DB is empty.
  const n = extractArticleNumber(params.query);
  if (n !== null && (/نظام\s*العمل/.test(params.query) || /مكتب\s*العمل/.test(params.query))) {
    const live = await fetchBoeLaborArticleSnippet({ articleNumber: n });
    if (live) return [live];
  }

  return [];
}

export function formatSnippetsForPrompt(snippets: RetrievedLegalSnippet[]) {
  if (snippets.length === 0) {
    return "لا توجد مقتطفات متاحة حالياً من قاعدة المعرفة الرسمية.";
  }

  const lines: string[] = [];
  lines.push(
    "مقتطفات من مصادر رسمية (قاعدة صارمة: عند ذكر مادة/نص/تاريخ/تعريف نظامي يجب أن يكون موجوداً حرفياً داخل مقتطف واحد على الأقل. عند الاستشهاد استخدم رقم المقتطف بين أقواس مربعة مثل [1] ثم ضع الروابط في قسم (المصادر).):"
  );

  snippets.forEach((s, idx) => {
    const title = s.title ? ` | ${s.title}` : "";
    lines.push(`\n[${idx + 1}] المصدر: ${s.source}${title}`);
    lines.push(`الرابط: ${s.url}`);
    lines.push(`المقتطف:\n${s.text}`);
  });

  return lines.join("\n");
}
