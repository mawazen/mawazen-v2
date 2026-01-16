import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

type LlmProvider = "openai" | "forge" | "gemini";

const resolveProvider = (): LlmProvider => {
  const p = (ENV.llmProvider ?? "").trim().toLowerCase();
  if (p === "gemini") return "gemini";
  if (p === "forge") return "forge";
  if (p === "openai") return "openai";

  const openaiKey = getValidOpenAiKey();
  if (openaiKey.length > 0) return "openai";
  return "forge";
};

const assertGeminiKey = () => {
  const k = ENV.geminiApiKey ? ENV.geminiApiKey.trim() : "";
  if (!k) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
};

const buildGeminiPrompt = (messages: Message[]): string => {
  return messages
    .map((m) => {
      const content = ensureArray(m.content)
        .map((p) => (typeof p === "string" ? p : p.type === "text" ? p.text : ""))
        .filter(Boolean)
        .join("\n");
      return `[${m.role}]\n${content}`.trim();
    })
    .join("\n\n");
};

const isGeminiModelNotFound = (status: number, bodyText: string) => {
  if (status !== 404) return false;
  const lower = (bodyText || "").toLowerCase();
  return lower.includes("models/") && (lower.includes("not found") || lower.includes("listmodels"));
};

const normalizeGeminiModelId = (raw: string) => {
  const m = (raw ?? "").trim();
  if (!m) return "";
  return m.startsWith("models/") ? m.slice("models/".length) : m;
};

const listGeminiModels = async (apiKey: string) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
    apiKey
  )}`;
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini ListModels failed: ${res.status} ${res.statusText} – ${text}`);
  }
  try {
    return JSON.parse(text) as any;
  } catch {
    throw new Error(`Gemini ListModels returned non-JSON response: ${text}`);
  }
};

const pickGeminiModelFromList = (listResponse: any): string => {
  const models: any[] = Array.isArray(listResponse?.models) ? listResponse.models : [];
  const candidates = models
    .filter((m) => Array.isArray(m?.supportedGenerationMethods))
    .filter((m) => (m.supportedGenerationMethods as string[]).includes("generateContent"));

  const score = (name: string) => {
    const id = normalizeGeminiModelId(name).toLowerCase();
    if (id.includes("1.5") && id.includes("flash")) return 100;
    if (id.includes("1.5") && id.includes("pro")) return 90;
    if (id === "gemini-pro") return 80;
    if (id.startsWith("gemini")) return 70;
    return 0;
  };

  const best = candidates
    .map((m) => String(m?.name || ""))
    .filter(Boolean)
    .sort((a, b) => score(b) - score(a))[0];

  return normalizeGeminiModelId(best || "");
};

const callGeminiGenerateContent = async (args: {
  apiKey: string;
  modelId: string;
  prompt: string;
}): Promise<{ text: string; usedModelId: string }> => {
  const { apiKey, modelId, prompt } = args;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelId
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    const error = new Error(
      `Gemini invoke failed: ${response.status} ${response.statusText} – ${bodyText}`
    ) as Error & { status?: number; bodyText?: string };
    error.status = response.status;
    error.bodyText = bodyText;
    throw error;
  }

  const data = JSON.parse(bodyText) as any;
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => (typeof p?.text === "string" ? p.text : ""))
      .filter(Boolean)
      .join("\n") ?? "";

  return { text, usedModelId: modelId };
};

const invokeGemini = async (params: InvokeParams): Promise<InvokeResult> => {
  assertGeminiKey();

  const apiKey = ENV.geminiApiKey.trim();
  const configuredModelId = normalizeGeminiModelId(ENV.geminiModel ?? "");
  const prompt = buildGeminiPrompt(params.messages);

  const modelAttempts = [
    configuredModelId,
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro",
    "gemini-pro",
  ].map(normalizeGeminiModelId);

  let usedModelId = "";
  let text = "";

  for (const modelId of modelAttempts) {
    if (!modelId) continue;
    try {
      const out = await callGeminiGenerateContent({ apiKey, modelId, prompt });
      usedModelId = out.usedModelId;
      text = out.text;
      break;
    } catch (e) {
      const err = e as any;
      const status = typeof err?.status === "number" ? err.status : 0;
      const bodyText = typeof err?.bodyText === "string" ? err.bodyText : String(err?.message || "");
      if (!isGeminiModelNotFound(status, bodyText)) {
        throw e;
      }
    }
  }

  if (!usedModelId) {
    const list = await listGeminiModels(apiKey);
    const picked = pickGeminiModelFromList(list);
    if (!picked) {
      throw new Error("Gemini ListModels did not return any model supporting generateContent");
    }
    const out = await callGeminiGenerateContent({ apiKey, modelId: picked, prompt });
    usedModelId = out.usedModelId;
    text = out.text;
  }

  const created = Math.floor(Date.now() / 1000);
  return {
    id: `gemini_${created}`,
    created,
    model: usedModelId,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text || "عذراً، حدث خطأ في معالجة طلبك.",
        },
        finish_reason: "stop",
      },
    ],
    usage: undefined,
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const getValidOpenAiKey = () => {
  const raw = ENV.openaiApiKey ? ENV.openaiApiKey.trim() : "";
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (
    lower.includes("sk-your-") ||
    lower.includes("your-openai-api-key") ||
    lower.includes("sk-your-openai-api-key-here")
  ) {
    return "";
  }
  return raw;
};

const resolveApiUrl = (provider: LlmProvider) =>
  provider === "openai"
    ? "https://api.openai.com/v1/chat/completions"
    : "https://forge.manus.im/v1/chat/completions";

const assertApiKey = (provider: LlmProvider) => {
  if (provider === "gemini") {
    assertGeminiKey();
    return;
  }

  const openaiKey = getValidOpenAiKey();
  const forgeKey = ENV.forgeApiKey ? ENV.forgeApiKey.trim() : "";

  if (provider === "openai") {
    if (!openaiKey) throw new Error("OPENAI_API_KEY is not configured");
    return;
  }

  if (provider === "forge") {
    if (!forgeKey) throw new Error("FORGE_API_KEY is not configured");
    return;
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  console.log("[LLM] Starting invokeLLM");

  const provider = resolveProvider();
  assertApiKey(provider);
  console.log("[LLM] API key check passed");

  if (provider === "gemini") {
    console.log("[LLM] Provider: gemini");
    return invokeGemini(params);
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gpt-4o-mini",
    messages: messages.map(normalizeMessage),
  };
  console.log("[LLM] Payload created with model:", payload.model);

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = 16384

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const apiUrl = resolveApiUrl(provider);
  console.log("[LLM] Calling API URL:", apiUrl);

  const openaiKey = getValidOpenAiKey();
  const forgeKey = ENV.forgeApiKey ? ENV.forgeApiKey.trim() : "";
  console.log("[LLM] Using OpenAI key:", !!openaiKey);
  console.log("[LLM] Provider:", provider);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${provider === "openai" ? openaiKey : forgeKey}`,
    },
    body: JSON.stringify(payload),
  });

  console.log("[LLM] Response status:", response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[LLM] Error response:", errorText);
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = await response.json();
  console.log("[LLM] Success - choices count:", result.choices?.length);
  return result as InvokeResult;
}
