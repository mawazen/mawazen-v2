export const ENV = {
  appId: process.env.VITE_APP_ID ?? "mawazin-legal-assistant-dev",
  cookieSecret:
    process.env.COOKIE_SECRET ??
    process.env.JWT_SECRET ??
    "your-super-secret-jwt-key-for-development-12345",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  backendUrl: process.env.BACKEND_URL ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  llmProvider: process.env.LLM_PROVIDER ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "",
  legalRetrievalDebug: process.env.LEGAL_RETRIEVAL_DEBUG === "true",
  legalRetrievalInsecureTls: process.env.LEGAL_RETRIEVAL_INSECURE_TLS === "true",
  googleApiKey: process.env.GOOGLE_API_KEY ?? "",
  googleCseId: process.env.GOOGLE_CSE_ID ?? "",
  serperApiKey: process.env.SERPER_API_KEY ?? "",
  googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
  googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
  moyasarSecretKey: process.env.MOYASAR_SECRET_KEY ?? "",
  moyasarPublishableKey: process.env.MOYASAR_PUBLISHABLE_KEY ?? "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioSmsFrom: process.env.TWILIO_SMS_FROM ?? "",
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? "",
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
