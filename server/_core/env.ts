export const ENV = {
  appId: process.env.VITE_APP_ID ?? "mawazin-legal-assistant-dev",
  cookieSecret: process.env.JWT_SECRET ?? "your-super-secret-jwt-key-for-development-12345",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  legalCrawlerEnabled: process.env.LEGAL_CRAWLER_ENABLED === "true",
  legalCrawlerIntervalMinutes: Number(process.env.LEGAL_CRAWLER_INTERVAL_MINUTES ?? "180"),
  legalCrawlerMaxPagesPerRun: Number(process.env.LEGAL_CRAWLER_MAX_PAGES_PER_RUN ?? "20"),
  legalCrawlerUserAgent:
    process.env.LEGAL_CRAWLER_USER_AGENT ?? "mawazin-legal-assistant/1.0 (+contact: admin@localhost)",
  legalCrawlerSeedSitemaps: (process.env.LEGAL_CRAWLER_SEED_SITEMAPS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  documentRemindersEnabled: process.env.DOCUMENT_REMINDERS_ENABLED === "true",
  documentRemindersIntervalMinutes: Number(process.env.DOCUMENT_REMINDERS_INTERVAL_MINUTES ?? "1440"),
};
