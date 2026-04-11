import { describe, expect, it } from "vitest";
import {
  classifyOpenRouterRuntimeError,
  OpenRouterRuntimeAdapterError,
} from "../adapters/openrouter/errors.js";
import { RuntimeExecutionError } from "../errors.js";

describe("classifyOpenRouterRuntimeError", () => {
  it("extends RuntimeExecutionError", () => {
    const error = classifyOpenRouterRuntimeError(new Error("test"));
    expect(error).toBeInstanceOf(RuntimeExecutionError);
    expect(error).toBeInstanceOf(OpenRouterRuntimeAdapterError);
    expect(error.name).toBe("OpenRouterRuntimeAdapterError");
  });

  it("preserves original error as cause", () => {
    const original = new Error("original");
    const classified = classifyOpenRouterRuntimeError(original);
    expect(classified.cause).toBe(original);
  });

  it("handles non-Error values", () => {
    const classified = classifyOpenRouterRuntimeError("string error");
    expect(classified.message).toBe("string error");
    expect(classified.adapterCode).toBe("OPENROUTER_RUNTIME_ERROR");
  });

  // Rate limit
  it.each([
    "rate limit exceeded",
    "rate_limit reached",
    "too many requests",
    "HTTP 429",
    "insufficient_quota",
    "quota exceeded",
    "You've hit your limit",
    "Limit reached for the day",
    "Limit exceeded",
    "Out of credits",
  ])("classifies rate limit: %s", (msg) => {
    const err = classifyOpenRouterRuntimeError(new Error(msg));
    expect(err.adapterCode).toBe("OPENROUTER_RATE_LIMIT");
    expect(err.category).toBe("rate_limit");
  });

  // Auth
  it.each([
    "Unauthorized access",
    "Invalid API key provided",
    "invalid_api_key",
    "Forbidden resource",
    "HTTP 401",
    "Error 403",
  ])("classifies auth error: %s", (msg) => {
    const err = classifyOpenRouterRuntimeError(new Error(msg));
    expect(err.adapterCode).toBe("OPENROUTER_AUTH_ERROR");
    expect(err.category).toBe("auth");
  });

  // Timeout
  it.each(["Request timed out", "Connection timeout", "ETIMEDOUT"])(
    "classifies timeout: %s",
    (msg) => {
      const err = classifyOpenRouterRuntimeError(new Error(msg));
      expect(err.adapterCode).toBe("OPENROUTER_TIMEOUT");
      expect(err.category).toBe("timeout");
    },
  );

  // Model not found
  it.each([
    "model not found",
    "no endpoints found for this model",
    "model_not_available",
    "no available model provider",
  ])("classifies model not found: %s", (msg) => {
    const err = classifyOpenRouterRuntimeError(new Error(msg));
    expect(err.adapterCode).toBe("OPENROUTER_MODEL_NOT_FOUND");
    expect(err.category).toBe("unknown");
  });

  // Context length
  it.each(["context_length_exceeded", "maximum context length is 4096"])(
    "classifies context length: %s",
    (msg) => {
      const err = classifyOpenRouterRuntimeError(new Error(msg));
      expect(err.adapterCode).toBe("OPENROUTER_CONTEXT_LENGTH");
      expect(err.category).toBe("unknown");
    },
  );

  // Content filter
  it.each(["content_filter triggered", "content_policy violation"])(
    "classifies content filter: %s",
    (msg) => {
      const err = classifyOpenRouterRuntimeError(new Error(msg));
      expect(err.adapterCode).toBe("OPENROUTER_CONTENT_FILTER");
      expect(err.category).toBe("unknown");
    },
  );

  // Transport
  it.each(["Connection refused", "ECONNREFUSED", "Network error", "fetch failed"])(
    "classifies transport error: %s",
    (msg) => {
      const err = classifyOpenRouterRuntimeError(new Error(msg));
      expect(err.adapterCode).toBe("OPENROUTER_TRANSPORT_ERROR");
      expect(err.category).toBe("unknown");
    },
  );

  // Fallback
  it("falls back to OPENROUTER_RUNTIME_ERROR for unknown errors", () => {
    const err = classifyOpenRouterRuntimeError(new Error("something unexpected"));
    expect(err.adapterCode).toBe("OPENROUTER_RUNTIME_ERROR");
    expect(err.category).toBe("unknown");
  });
});
