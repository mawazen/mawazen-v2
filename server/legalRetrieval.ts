import * as db from "./db";
import { ENV } from "./_core/env";
import { embedText } from "./legalEmbeddings";
import axios from "axios";
import https from "https";

export type RetrievedLegalSnippet = {
  text: string;
  score: number;
  source: string;
  url: string;
  title: string | null;
  meta: Record<string, unknown> | null;
};

type SimpleHttpResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let t: any;
  const timeout = new Promise<T>((_, reject) => {
    t = setTimeout(() => reject(new Error(`timeout:${label}:${ms}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (t) clearTimeout(t);
  }
}

function isInsecureTlsAllowedForUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "laws.boe.gov.sa" || host.endsWith(".boe.gov.sa")) return true;
    if (host === "duckduckgo.com" || host.endsWith(".duckduckgo.com")) return true;
    if (host === "www.googleapis.com") return true;
    return false;
  } catch {
    return false;
  }
}

async function httpGetText(url: string, headers: Record<string, string>): Promise<SimpleHttpResponse> {
  const f = (globalThis as any)?.fetch as
    | undefined
    | ((input: string, init?: { headers?: Record<string, string>; redirect?: "follow" | "manual" | "error" }) => Promise<any>);

  if (typeof f === "function") {
    try {
      const res = await f(url, { headers, redirect: "follow" });
      return {
        ok: !!res?.ok,
        status: Number(res?.status ?? 0),
        text: async () => String(await res.text()),
      };
    } catch (e) {
      if (ENV.legalRetrievalDebug) {
        console.warn("[LegalRetrieval] fetch error", {
          url,
          message: e instanceof Error ? e.message : String(e),
        });
      }
      // fall through to axios
    }
  }

  try {
    const insecure = ENV.legalRetrievalInsecureTls && isInsecureTlsAllowedForUrl(url);
    const res = await axios.get(url, {
      headers,
      maxRedirects: 5,
      timeout: 12000,
      responseType: "text",
      httpsAgent: insecure ? new https.Agent({ rejectUnauthorized: false }) : undefined,
      validateStatus: () => true,
    });
    if (ENV.legalRetrievalDebug && !(res.status >= 200 && res.status < 300)) {
      console.warn("[LegalRetrieval] HTTP non-2xx", { url, status: res.status });
    }
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      text: async () => String(res.data ?? ""),
    };
  } catch (e) {
    if (ENV.legalRetrievalDebug) {
      console.warn("[LegalRetrieval] HTTP error", {
        url,
        message: e instanceof Error ? e.message : String(e),
      });
    }
    return {
      ok: false,
      status: 0,
      text: async () => "",
    };
  }
}

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

function normalizeDigits(input: string) {
  return String(input ?? "").replace(/[٠-٩]/g, (d) => {
    const map: Record<string, string> = {
      "٠": "0",
      "١": "1",
      "٢": "2",
      "٣": "3",
      "٤": "4",
      "٥": "5",
      "٦": "6",
      "٧": "7",
      "٨": "8",
      "٩": "9",
    };
    return map[d] ?? d;
  });
}

function isArticleTextQuery(query: string): boolean {
  const q = normalizeDigits(String(query ?? ""))
    .replace(/[\u200f\u200e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return /(نص\s*المادة|تنص\s*المادة|(?:ال)?ماد(?:ة|ه)\s*\d{1,4}|لماد(?:ة|ه)\s*\d{1,4})/.test(q);
}

function extractArticleNumber(query: string): number | null {
  const q = normalizeDigits(String(query ?? ""));
  const m = q.match(/(?:المادة|ماده|مادة|لمادة)\s*(?:رقم\s*)?[:(\[]?\s*([0-9]{1,4})/);
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
  if (n < 100) return ordinalUnder100(n);
  if (n === 100) return "المائة";
  if (n > 100 && n < 200) {
    const under = ordinalUnder100(n - 100);
    if (!under) return null;
    return `${under} بعد المائة`;
  }
  if (n === 200) return "المائتين";
  if (n > 200 && n < 300) {
    const under = ordinalUnder100(n - 200);
    if (!under) return null;
    return `${under} بعد المائتين`;
  }
  return null;
}

function toHostLabel(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "WEB";
  }
}

function isAllowedWebFallbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "laws.boe.gov.sa") return true;
  if (h.endsWith(".boe.gov.sa")) return true;
  if (h === "mohr.gov.sa" || h.endsWith(".mohr.gov.sa")) return true;
  if (h === "almrj3.com" || h.endsWith(".almrj3.com")) return true;
  if (h === "elmokhtarlaw.com" || h.endsWith(".elmokhtarlaw.com")) return true;
  if (h === "saudi-lawyers.net" || h.endsWith(".saudi-lawyers.net")) return true;
  return false;
}

function looksLikeRequestedArticleText(params: { text: string; articleNumber: number; boeLabel: string | null }) {
  const text = String(params.text ?? "");
  if (!text.trim()) return false;
  const n = params.articleNumber;
  const boeLabel = params.boeLabel;
  if (boeLabel) {
    const labelPattern = escapeRegex(boeLabel).replace(/\s+/g, "\\s+");
    const re = new RegExp(`المادة\\s*(?:[\\(\\[]\\s*)?${labelPattern}(?:\\s*[\\)\\]])?`);
    if (re.test(text)) return true;
  }
  const reNum = new RegExp(`المادة\\s*(?:[\\(\\[]\\s*)?${n}(?:\\s*[\\)\\]])?(?:\\s*[:：])?`);
  return reNum.test(text);
}

function extractDuckDuckGoResultUrls(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const patterns: RegExp[] = [
    // class before href
    /<a[^>]+class=(?:"|')([^"']*\bresult__a\b[^"']*)(?:"|')[^>]+href=(?:"|')([^"']+)(?:"|')/gi,
    // href before class
    /<a[^>]+href=(?:"|')([^"']+)(?:"|')[^>]+class=(?:"|')([^"']*\bresult__a\b[^"']*)(?:"|')/gi,
  ];

  const rawHrefs: string[] = [];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      // Depending on pattern, href may be group 1 or 2
      const href = (m[2] ?? m[1] ?? "").trim();
      if (href) rawHrefs.push(href);
    }
  }

  for (let href of rawHrefs) {
    href = href.trim();
    if (!href) continue;
    href = href.replace(/&amp;/g, "&");

    // Normalize scheme/relative links
    if (href.startsWith("//")) href = `https:${href}`;
    if (href.startsWith("/")) href = `https://duckduckgo.com${href}`;

    // DuckDuckGo often wraps outbound links in /l/?uddg=<encoded>
    try {
      const u = new URL(href);
      if (u.hostname.endsWith("duckduckgo.com") && u.pathname.startsWith("/l/")) {
        const uddg = u.searchParams.get("uddg");
        if (uddg) href = decodeURIComponent(uddg);
      }
    } catch {
      // keep original
    }

    if (!href) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    urls.push(href);
    if (urls.length >= 15) break;
  }

  return urls;
}

function extractGoogleResultUrls(jsonText: string): string[] {
  try {
    const data = JSON.parse(jsonText) as any;
    const items = Array.isArray(data?.items) ? data.items : [];
    const urls: string[] = [];
    for (const it of items) {
      const link = typeof it?.link === "string" ? it.link.trim() : "";
      if (!link) continue;
      urls.push(link);
      if (urls.length >= 8) break;
    }
    return urls;
  } catch {
    return [];
  }
}

function extractSerperResultUrls(payload: unknown): string[] {
  const urls: string[] = [];
  try {
    const data = payload as any;
    const organic = Array.isArray(data?.organic) ? data.organic : [];
    for (const it of organic) {
      const link = typeof it?.link === "string" ? it.link.trim() : "";
      if (!link) continue;
      urls.push(link);
      if (urls.length >= 8) break;
    }
  } catch {
    return [];
  }
  return urls;
}

async function serperSearchArticleSnippet(params: { query: string; articleNumber: number }): Promise<RetrievedLegalSnippet | null> {
  const q = String(params.query ?? "").trim();
  if (!q) return null;
  if (!isArticleTextQuery(q)) return null;
  if (!ENV.serperApiKey || !ENV.serperApiKey.trim()) {
    console.warn("[LegalRetrieval] SERPER_API_KEY missing");
    return null;
  }

  const laborLawQuery = /نظام\s*العمل|مكتب\s*العمل/.test(q);

  const n = params.articleNumber;
  const boeLabel = articleLabelBoeStyle(n);
  const baseNeedle = boeLabel ? `المادة ${boeLabel}` : `المادة ${n}`;

  const queries = [
    `site:laws.boe.gov.sa ${baseNeedle} نص`,
    ...(laborLawQuery ? [`site:mohr.gov.sa ${baseNeedle} نظام العمل نص`] : []),
    `${q} ${baseNeedle}`,
  ];

  for (const expandedQuery of queries) {
    try {
      const res = await withTimeout(
        axios.post(
          "https://google.serper.dev/search",
          { q: expandedQuery },
          {
            headers: {
              "X-API-KEY": ENV.serperApiKey,
              "Content-Type": "application/json",
            },
            timeout: 12000,
            maxBodyLength: Infinity,
            validateStatus: () => true,
          }
        ),
        15000,
        "serper.search"
      );

      if (!(res.status >= 200 && res.status < 300)) continue;

      try {
        const data = res.data as any;
        const answerBoxText =
          typeof data?.answerBox?.answer === "string"
            ? data.answerBox.answer
            : typeof data?.answerBox?.snippet === "string"
              ? data.answerBox.snippet
              : typeof data?.answerBox?.snippetHighlighted === "string"
                ? data.answerBox.snippetHighlighted
                : "";
        if (
          answerBoxText &&
          looksLikeRequestedArticleText({
            text: answerBoxText,
            articleNumber: n,
            boeLabel,
          })
        ) {
          return {
            text: answerBoxText.trim().slice(0, 1600),
            score: 0.72,
            source: "SERPER",
            url: "https://google.com",
            title: null,
            meta: { law: "unknown", article: n, provider: "serper_answerbox" },
          };
        }

        const organic = Array.isArray(data?.organic) ? data.organic : [];
        for (const it of organic) {
          const link = typeof it?.link === "string" ? it.link.trim() : "";
          const snippet = typeof it?.snippet === "string" ? it.snippet.trim() : "";
          if (!link || !snippet) continue;
          if (laborLawQuery && !isLaborLawOfficialUrl(link)) continue;
          if (!looksLikeRequestedArticleText({ text: snippet, articleNumber: n, boeLabel })) continue;
          return {
            text: snippet.slice(0, 4000),
            score: 0.55,
            source: toHostLabel(link),
            url: link,
            title: null,
            meta: { law: "unknown", article: n, provider: "serper_organic_snippet" },
          };
        }
      } catch {
      }

      const candidates = extractSerperResultUrls(res.data);

      if (candidates.length === 0) continue;

      for (const u of candidates) {
        let host = "";
        try {
          host = new URL(u).hostname;
        } catch {
          continue;
        }
        if (!u.startsWith("http://") && !u.startsWith("https://")) continue;
        if (!isAllowedWebFallbackHost(host)) continue;
        if (laborLawQuery && !isLaborLawOfficialUrl(u)) continue;

        const pageRes = await withTimeout(
          httpGetText(u, {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "user-agent": ENV.legalCrawlerUserAgent,
        }),
          15000,
          "serper.page"
        );
        if (!pageRes.ok) continue;
        const pageHtml = await pageRes.text();
        const plain = pageHtml
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

        const patterns: RegExp[] = [];
        if (boeLabel) {
          const labelPattern = escapeRegex(boeLabel).replace(/\s+/g, "\\s+");
          patterns.push(new RegExp(`المادة\\s*(?:[\(\[]\\s*)?${labelPattern}(?:\\s*[\)\]])?\\s*:?([\\s\\S]*?)(?=\\s*المادة\\s*(?:[\(\[]\\s*)?|$)`));
        }
        patterns.push(new RegExp(`المادة\\s*(?:[\(\[]\\s*)?${n}(?:\\s*[\)\]])?\\s*:?([\\s\\S]*?)(?=\\s*المادة\\s*(?:[\(\[]\\s*)?|$)`));

        for (const re of patterns) {
          const m = plain.match(re);
          if (!m?.[0]) continue;
          const snippetText = String(m[0]).trim().slice(0, 4000);
          if (snippetText.length < 40) continue;
          return {
            text: snippetText,
            score: 0.66,
            source: toHostLabel(u),
            url: u,
            title: null,
            meta: { law: "unknown", article: n, provider: "serper" },
          };
        }
      }
    } catch {
    }
  }

  try {
    const res = await withTimeout(
      axios.post(
        "https://google.serper.dev/search",
        { q },
        {
          headers: {
            "X-API-KEY": ENV.serperApiKey,
            "Content-Type": "application/json",
          },
          timeout: 12000,
          maxBodyLength: Infinity,
          validateStatus: () => true,
        }
      ),
      15000,
      "serper.search.fallback"
    );
    if (res.status >= 200 && res.status < 300) {
      const organic = Array.isArray((res.data as any)?.organic) ? (res.data as any).organic : [];
      for (const it of organic) {
        const link = typeof it?.link === "string" ? it.link.trim() : "";
        const snippet = typeof it?.snippet === "string" ? it.snippet.trim() : "";
        if (!link || !snippet) continue;
        if (laborLawQuery && !isLaborLawOfficialUrl(link)) continue;
        if (!looksLikeRequestedArticleText({ text: snippet, articleNumber: params.articleNumber, boeLabel })) continue;
        return {
          text: snippet.slice(0, 4000),
          score: 0.5,
          source: toHostLabel(link),
          url: link,
          title: null,
          meta: { law: "unknown", article: n, provider: "serper_snippet" },
        };
      }
    }
  } catch {
  }

  return null;
}

async function googleSearchArticleSnippet(params: { query: string; articleNumber: number }): Promise<RetrievedLegalSnippet | null> {
  const q = String(params.query ?? "").trim();
  if (!q) return null;
  if (!isArticleTextQuery(q)) return null;
  if (!ENV.googleApiKey || !ENV.googleCseId) return null;

  const n = params.articleNumber;
  const boeLabel = articleLabelBoeStyle(n);
  const expandedQuery =
    n === 1
      ? `نص المادة الأولى من نظام العمل تسري أحكام هذا النظام`
      : boeLabel
        ? `${q} المادة ${boeLabel} نظام العمل`
        : q;

  const apiUrl =
    `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(ENV.googleApiKey)}` +
    `&cx=${encodeURIComponent(ENV.googleCseId)}` +
    `&q=${encodeURIComponent(expandedQuery)}`;

  try {
    const res = await httpGetText(apiUrl, {
      accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
      "user-agent": ENV.legalCrawlerUserAgent,
    });
    if (!res.ok) return null;
    const jsonText = await res.text();
    const candidates = extractGoogleResultUrls(jsonText);

    for (const u of candidates) {
      let host = "";
      try {
        host = new URL(u).hostname;
      } catch {
        continue;
      }
      if (!isAllowedWebFallbackHost(host)) continue;

      const pageRes = await httpGetText(u, {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": ENV.legalCrawlerUserAgent,
      });
      if (!pageRes.ok) continue;
      const pageHtml = await pageRes.text();
      const plain = pageHtml
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

      const patterns: RegExp[] = [];
      if (boeLabel) {
        const labelPattern = escapeRegex(boeLabel).replace(/\s+/g, "\\s+");
        patterns.push(new RegExp(`المادة\\s*(?:[\(\[]\\s*)?${labelPattern}(?:\\s*[\)\]])?\\s*:?([\\s\\S]*?)(?=\\s*المادة\\s*(?:[\(\[]\\s*)?|$)`));
      }
      patterns.push(new RegExp(`المادة\\s*(?:[\(\[]\\s*)?${n}(?:\\s*[\)\]])?\\s*:?([\\s\\S]*?)(?=\\s*المادة\\s*(?:[\(\[]\\s*)?|$)`));

      for (const re of patterns) {
        const m = plain.match(re);
        if (!m?.[0]) continue;
        const snippetText = String(m[0]).trim().slice(0, 1600);
        if (snippetText.length < 40) continue;
        return {
          text: snippetText,
          score: 0.7,
          source: toHostLabel(u),
          url: u,
          title: null,
          meta: { law: "unknown", article: n },
        };
      }
    }
  } catch {
  }

  return null;
}

async function webSearchArticleSnippet(params: { query: string; articleNumber: number }): Promise<RetrievedLegalSnippet | null> {
  const q = String(params.query ?? "").trim();
  if (!q) return null;
  if (!isArticleTextQuery(q)) return null;

  const laborLawQuery = /نظام\s*العمل|مكتب\s*العمل/.test(q);

  const n = params.articleNumber;
  const boeLabel = articleLabelBoeStyle(n);
  const expandedQuery =
    n === 1
      ? `نص المادة الأولى من نظام العمل تسري أحكام هذا النظام`
      : boeLabel
        ? `${q} المادة ${boeLabel} نظام العمل`
        : q;

  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(expandedQuery)}`;
  try {
    const res = await httpGetText(searchUrl, {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": ENV.legalCrawlerUserAgent,
    });
    if (!res.ok) return null;
    const html = await res.text();
    const candidates = extractDuckDuckGoResultUrls(html);
    for (const u of candidates) {
      let host = "";
      try {
        host = new URL(u).hostname;
      } catch {
        continue;
      }
      if (!isAllowedWebFallbackHost(host)) continue;
      if (laborLawQuery && !u.includes(BOE_LABOR_LAW_ID)) continue;

      const pageRes = await httpGetText(u, {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": ENV.legalCrawlerUserAgent,
      });
      if (!pageRes.ok) continue;
      const pageHtml = await pageRes.text();
      const plain = pageHtml
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

      const patterns: RegExp[] = [];
      if (boeLabel) {
        const labelPattern = escapeRegex(boeLabel).replace(/\s+/g, "\\s+");
        patterns.push(
          new RegExp(
            `المادة\\s*(?:[\\(\\[]\\s*)?${labelPattern}(?:\\s*[\\)\\]])?\\s*:?([\\s\\S]*?)(?=\\s*المادة\\s*(?:[\\(\\[]\\s*)?|$)`
          )
        );
      }
      patterns.push(
        new RegExp(
          `المادة\\s*(?:[\\(\\[]\\s*)?${n}(?:\\s*[\\)\\]])?\\s*:?([\\s\\S]*?)(?=\\s*المادة\\s*(?:[\\(\\[]\\s*)?|$)`
        )
      );

      for (const re of patterns) {
        const m = plain.match(re);
        if (!m?.[0]) continue;
        const snippetText = String(m[0]).trim().slice(0, 4000);
        if (snippetText.length < 40) continue;
        return {
          text: snippetText,
          score: 0.65,
          source: toHostLabel(u),
          url: u,
          title: null,
          meta: { law: "unknown", article: n },
        };
      }
    }
  } catch {
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

const BOE_LABOR_LAW_URL = "https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/08381293-6388-48e2-8ad2-a9a700f2aa94/1";
const BOE_LABOR_LAW_ID = "08381293-6388-48e2-8ad2-a9a700f2aa94";

function isLaborLawOfficialUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h === "laws.boe.gov.sa" || h.endsWith(".boe.gov.sa")) {
      return url.includes(BOE_LABOR_LAW_ID);
    }
    if (h === "mohr.gov.sa" || h.endsWith(".mohr.gov.sa")) return true;
    return false;
  } catch {
    return false;
  }
}

function getStaticBoeLaborLawSnippet(articleNumber: number): RetrievedLegalSnippet | null {
  if (articleNumber === 1) {
    const text = "المادة الأولى :\nيسمى هذا النظام نظام العمل.";
    return {
      text,
      score: 0.95,
      source: "BOE (cached)",
      url: BOE_LABOR_LAW_URL,
      title: "نظام العمل",
      meta: { law: "labor_law", article: 1 },
    };
  }

  if (articleNumber !== 107) return null;

  const text =
    "المادة السابعة بعد المائة :\n" +
    "- صدر المرسوم الملكي رقم (م/44) وتاريخ 1446/2/8هـ، وذلك بالموافقة على تعديلات بعض مواد نظام العمل (ويعمل بها من تاريخ 1446/8/20هـ) وعدلت الفقرة (1) من هذه المادة لتكون بالنص الآتي: \"يجب على صاحب العمل أن يدفع للعامل أجراً إضافيًّا عن ساعات العمل الإضافية يوازي أجر الساعة مضافاً إليه (50%) من أجره الأساسي، ويجوز لصاحب العمل بموافقة العامل أن يحتسب للعامل أيام إجازة تعويضية مدفوعة الأجر بدلاً عن الأجر المستحق للعامل لساعات العمل الإضافية. وتبين اللائحة الأحكام المتصلة بذلك\".";

  return {
    text,
    score: 0.94,
    source: "BOE (cached)",
    url: BOE_LABOR_LAW_URL,
    title: "نظام العمل",
    meta: { law: "labor_law", article: 107 },
  };
}

async function fetchBoeLaborArticleSnippet(params: { articleNumber: number }): Promise<RetrievedLegalSnippet | null> {
  const boeLabel = articleLabelBoeStyle(params.articleNumber);
  if (!boeLabel) return getStaticBoeLaborLawSnippet(params.articleNumber);

  const url = BOE_LABOR_LAW_URL;
  try {
    const res = await httpGetText(url, {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": ENV.legalCrawlerUserAgent,
    });
    if (!res.ok) return getStaticBoeLaborLawSnippet(params.articleNumber);
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

    const labelPattern = escapeRegex(boeLabel).replace(/\s+/g, "\\s+");
    const patterns: RegExp[] = [
      new RegExp(
        `المادة\\s*(?:[\\(\\[]\\s*)?${labelPattern}(?:\\s*[\\)\\]])?\\s*:?([\\s\\S]*?)(?=\\s*المادة\\s*(?:[\\(\\[]\\s*)?|$)`
      ),
      new RegExp(
        `المادة\\s*(?:[\\(\\[]\\s*)?${params.articleNumber}(?:\\s*[\\)\\]])?\\s*:?([\\s\\S]*?)(?=\\s*المادة\\s*(?:[\\(\\[]\\s*)?|$)`
      ),
    ];

    let bestText: string | null = null;
    for (const re0 of patterns) {
      const re = new RegExp(re0.source, re0.flags.includes("g") ? re0.flags : `${re0.flags}g`);
      for (const m of plain.matchAll(re)) {
        const t = String(m?.[0] ?? "").trim();
        if (t.length < 40) continue;
        if (!bestText || t.length > bestText.length) bestText = t;
      }
    }

    if (!bestText) return getStaticBoeLaborLawSnippet(params.articleNumber);
    const snippetText = bestText.slice(0, 4000);
    if (snippetText.length < 40) return getStaticBoeLaborLawSnippet(params.articleNumber);

    return {
      text: snippetText,
      score: 0.95,
      source: "BOE",
      url,
      title: "نظام العمل",
      meta: { law: "labor_law", article: params.articleNumber },
    };
  } catch {
    return getStaticBoeLaborLawSnippet(params.articleNumber);
  }
}

export async function retrieveLegalSnippets(params: {
  query: string;
  topK?: number;
  scanLimit?: number;
}): Promise<RetrievedLegalSnippet[]> {
  const topK = params.topK ?? 6;
  const scanLimit = params.scanLimit ?? 400;

  const requestedArticleNumber = extractArticleNumber(params.query);
  const wantsArticleText = requestedArticleNumber !== null && isArticleTextQuery(params.query);
  const requestedBoeLabel = requestedArticleNumber !== null ? articleLabelBoeStyle(requestedArticleNumber) : null;

  if (wantsArticleText && requestedArticleNumber) {
    console.log("[LegalRetrieval] article_query", {
      article: requestedArticleNumber,
      hasSerperKey: !!ENV.serperApiKey,
      query: params.query,
    });
  }

  if (wantsArticleText && requestedArticleNumber && /نظام\s*العمل|مكتب\s*العمل/.test(params.query)) {
    const boeSnippet = await withTimeout(fetchBoeLaborArticleSnippet({ articleNumber: requestedArticleNumber }), 18000, "boe.labor");
    if (boeSnippet && looksLikeRequestedArticleText({ text: boeSnippet.text, articleNumber: requestedArticleNumber, boeLabel: requestedBoeLabel })) {
      return [boeSnippet];
    }
  }

  // =================================================================
  // HOTFIX: Force Serper search for article text queries to bypass
  // the unreliable internal DB search for this critical feature.
  // =================================================================
  if (wantsArticleText && requestedArticleNumber) {
    const serperSnippet = await withTimeout(
      serperSearchArticleSnippet({ query: params.query, articleNumber: requestedArticleNumber }),
      20000,
      "serper.orchestrator"
    );
    if (serperSnippet) return [serperSnippet];
  }

  const terms = buildKeywordTerms(params.query);

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

        if (
          scored.length > 0 &&
          scored[0]!.score >= 0.2 &&
          (!wantsArticleText ||
            (requestedArticleNumber !== null &&
              looksLikeRequestedArticleText({
                text: scored[0]!.text,
                articleNumber: requestedArticleNumber,
                boeLabel: requestedBoeLabel,
              })))
        ) {
          return scored;
        }
      }
    } catch {
    }
  }

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
    if (
      scored.length > 0 &&
      (!wantsArticleText ||
        (requestedArticleNumber !== null &&
          looksLikeRequestedArticleText({
            text: scored[0]!.text,
            articleNumber: requestedArticleNumber,
            boeLabel: requestedBoeLabel,
          })))
    ) {
      return scored;
    }
  } catch {
  }

  if (wantsArticleText && requestedArticleNumber) {
    const n = requestedArticleNumber;

    const serperSnippet = await serperSearchArticleSnippet({ query: params.query, articleNumber: n });
    if (serperSnippet) return [serperSnippet];

    if (/نظام\s*العمل|مكتب\s*العمل/.test(params.query)) {
      const boeSnippet = await fetchBoeLaborArticleSnippet({ articleNumber: n });
      if (boeSnippet) return [boeSnippet];
    }

    const googleSnippet = await googleSearchArticleSnippet({ query: params.query, articleNumber: n });
    if (googleSnippet) return [googleSnippet];

    const duckduckgoSnippet = await webSearchArticleSnippet({ query: params.query, articleNumber: n });
    if (duckduckgoSnippet) return [duckduckgoSnippet];
  }

  return [];
}

export function formatSnippetsForPrompt(snippets: RetrievedLegalSnippet[]): string {
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
