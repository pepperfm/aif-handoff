import { RuntimeExecutionError, type RuntimeErrorCategory } from "../../errors.js";

const RATE_LIMIT_PATTERNS = [
  "rate limit",
  "rate_limit",
  "too many requests",
  "429",
  "insufficient_quota",
  "quota",
];
const AUTH_PATTERNS = [
  "unauthorized",
  "invalid api key",
  "invalid_api_key",
  "forbidden",
  "401",
  "403",
];
const TIMEOUT_PATTERNS = ["timed out", "timeout", "etimedout"];
const MODEL_NOT_FOUND_PATTERNS = [
  "model not found",
  "no endpoints found",
  "model_not_available",
  "no available model",
];
const CONTEXT_LENGTH_PATTERNS = ["context_length_exceeded", "maximum context length"];
const CONTENT_FILTER_PATTERNS = ["content_filter", "content_policy"];
const TRANSPORT_PATTERNS = ["connection refused", "econnrefused", "network", "fetch failed"];

function messageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function classify(message: string): { adapterCode: string; category: RuntimeErrorCategory } {
  const lowered = message.toLowerCase();
  if (RATE_LIMIT_PATTERNS.some((p) => lowered.includes(p))) {
    return { adapterCode: "OPENROUTER_RATE_LIMIT", category: "rate_limit" };
  }
  if (AUTH_PATTERNS.some((p) => lowered.includes(p))) {
    return { adapterCode: "OPENROUTER_AUTH_ERROR", category: "auth" };
  }
  if (TIMEOUT_PATTERNS.some((p) => lowered.includes(p))) {
    return { adapterCode: "OPENROUTER_TIMEOUT", category: "timeout" };
  }
  if (MODEL_NOT_FOUND_PATTERNS.some((p) => lowered.includes(p))) {
    return { adapterCode: "OPENROUTER_MODEL_NOT_FOUND", category: "unknown" };
  }
  if (CONTEXT_LENGTH_PATTERNS.some((p) => lowered.includes(p))) {
    return { adapterCode: "OPENROUTER_CONTEXT_LENGTH", category: "unknown" };
  }
  if (CONTENT_FILTER_PATTERNS.some((p) => lowered.includes(p))) {
    return { adapterCode: "OPENROUTER_CONTENT_FILTER", category: "unknown" };
  }
  if (TRANSPORT_PATTERNS.some((p) => lowered.includes(p))) {
    return { adapterCode: "OPENROUTER_TRANSPORT_ERROR", category: "unknown" };
  }
  return { adapterCode: "OPENROUTER_RUNTIME_ERROR", category: "unknown" };
}

export class OpenRouterRuntimeAdapterError extends RuntimeExecutionError {
  public readonly adapterCode: string;

  constructor(
    message: string,
    adapterCode: string,
    category: RuntimeErrorCategory,
    cause?: unknown,
  ) {
    super(message, cause, category);
    this.name = "OpenRouterRuntimeAdapterError";
    this.adapterCode = adapterCode;
  }
}

export function classifyOpenRouterRuntimeError(error: unknown): OpenRouterRuntimeAdapterError {
  const message = messageFromUnknown(error);
  const { adapterCode, category } = classify(message);
  return new OpenRouterRuntimeAdapterError(message, adapterCode, category, error);
}
