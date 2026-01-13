import { retrieveLegalSnippets } from "../server/legalRetrieval";

async function fetchText(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers, redirect: "follow" });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

function extractDdgsUrls(html: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const patterns: RegExp[] = [
    /<a[^>]+class=(?:"|')([^"']*\bresult__a\b[^"']*)(?:"|')[^>]+href=(?:"|')([^"']+)(?:"|')/gi,
    /<a[^>]+href=(?:"|')([^"']+)(?:"|')[^>]+class=(?:"|')([^"']*\bresult__a\b[^"']*)(?:"|')/gi,
  ];
  const raw: string[] = [];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      raw.push(String(m[2] ?? m[1] ?? ""));
    }
  }
  for (let href of raw) {
    href = href.trim().replace(/&amp;/g, "&");
    if (!href) continue;
    if (href.startsWith("//")) href = `https:${href}`;
    if (href.startsWith("/")) href = `https://duckduckgo.com${href}`;
    try {
      const u = new URL(href);
      if (u.hostname.endsWith("duckduckgo.com") && u.pathname.startsWith("/l/")) {
        const uddg = u.searchParams.get("uddg");
        if (uddg) href = decodeURIComponent(uddg);
      }
    } catch {
      // ignore
    }
    if (!href) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(href);
    if (out.length >= 10) break;
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const query =
    (typeof argv[0] === "string" && argv[0].trim() ? argv[0].trim() : "") ||
    (typeof process.env.LEGAL_QUERY === "string" && process.env.LEGAL_QUERY.trim()
      ? process.env.LEGAL_QUERY.trim()
      : "") ||
    "نص المادة 1 من نظام العمل";
  // Basic runtime diagnostics (no secrets)
  const hasFetch = typeof (globalThis as any).fetch === "function";
  console.log("[smoke] node", process.version);
  console.log("[smoke] hasFetch", hasFetch);
  console.log("[smoke] query", query);

  const snippets = await retrieveLegalSnippets({ query, topK: 6, scanLimit: 500 });
  console.log("[smoke] snippets.length", snippets.length);

  for (let i = 0; i < snippets.length; i++) {
    const s = snippets[i]!;
    console.log("\n--- snippet", i + 1, "---");
    console.log("score:", s.score);
    console.log("source:", s.source);
    console.log("url:", s.url);
    console.log("text:\n", s.text);
  }

  if (snippets.length === 0) {
    const ua = "mawazin-legal-assistant-smoke/1.0";
    const boeUrl = "https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/08381293-6388-48e2-8ad2-a9a700f2aa94/1";
    console.log("\n[smoke] fetching BOE raw HTML...");
    const boe = await fetchText(boeUrl, {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": ua,
    });
    console.log("[smoke] BOE status", boe.status, "ok", boe.ok, "len", boe.text.length);
    console.log("[smoke] BOE has(المادة الأولى)", boe.text.includes("المادة الأولى"));
    console.log("[smoke] BOE has(المادة الاولى)", boe.text.includes("المادة الاولى"));
    console.log("[smoke] BOE has(تسري أحكام هذا النظام)", boe.text.includes("تسري أحكام هذا النظام"));

    const ddgQuery = "نص المادة الأولى من نظام العمل تسري أحكام هذا النظام";
    const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(ddgQuery)}`;
    console.log("\n[smoke] fetching DuckDuckGo HTML...");
    const ddg = await fetchText(ddgUrl, {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": ua,
    });
    console.log("[smoke] DDG status", ddg.status, "ok", ddg.ok, "len", ddg.text.length);
    const urls = extractDdgsUrls(ddg.text);
    console.log("[smoke] DDG extracted urls", urls.length);
    for (const u of urls) console.log("[smoke] DDG url", u);
    console.log("[smoke] DDG preview:\n", ddg.text.slice(0, 800).replace(/\s+/g, " "));
  }
}

main().catch((e) => {
  console.error("[smoke] error", e);
  process.exitCode = 1;
});
