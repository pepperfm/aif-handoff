import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const logActivityMock = vi.fn();
const incrementTaskTokenUsageMock = vi.fn();
const saveTaskSessionIdMock = vi.fn();
const getTaskSessionIdMock = vi.fn(() => null);
(globalThis as { __AIF_CLAUDE_QUERY_MOCK__?: typeof queryMock }).__AIF_CLAUDE_QUERY_MOCK__ =
  queryMock;

vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  query: queryMock,
  listSessions: vi.fn(async () => []),
  getSessionInfo: vi.fn(async () => null),
  getSessionMessages: vi.fn(async () => []),
}));

vi.mock("@aif/data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aif/data")>();
  return {
    ...actual,
    incrementTaskTokenUsage: incrementTaskTokenUsageMock,
    updateTaskHeartbeat: vi.fn(),
    renewTaskClaim: vi.fn(),
    saveTaskSessionId: saveTaskSessionIdMock,
    getTaskSessionId: getTaskSessionIdMock,
    findTaskById: vi.fn(() => ({
      id: "task-1",
      projectId: "project-1",
      runtimeOptionsJson: null,
      modelOverride: null,
    })),
    resolveEffectiveRuntimeProfile: vi.fn(() => ({
      source: "none",
      profile: null,
      taskRuntimeProfileId: null,
      projectRuntimeProfileId: null,
      systemRuntimeProfileId: null,
    })),
  };
});

vi.mock("@aif/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aif/shared")>();
  return {
    ...actual,
    getEnv: () => ({
      ANTHROPIC_API_KEY: "test-key",
      ANTHROPIC_BASE_URL: undefined,
      OPENAI_API_KEY: undefined,
      OPENAI_BASE_URL: undefined,
      CODEX_CLI_PATH: undefined,
      AGENTAPI_BASE_URL: undefined,
      AIF_RUNTIME_MODULES: [],
      PORT: 3009,
      POLL_INTERVAL_MS: 30000,
      AGENT_STAGE_STALE_TIMEOUT_MS: 90 * 60 * 1000,
      AGENT_STAGE_STALE_MAX_RETRY: 3,
      AGENT_STAGE_RUN_TIMEOUT_MS: 60 * 60 * 1000,
      AGENT_QUERY_START_TIMEOUT_MS: 60 * 1000,
      AGENT_QUERY_START_RETRY_DELAY_MS: 1000,
      DATABASE_URL: "./data/aif.sqlite",
      CORS_ORIGIN: "*",
      API_BASE_URL: "http://localhost:3009",
      AGENT_QUERY_AUDIT_ENABLED: true,
      LOG_LEVEL: "debug",
      ACTIVITY_LOG_MODE: "sync",
      ACTIVITY_LOG_BATCH_SIZE: 20,
      ACTIVITY_LOG_BATCH_MAX_AGE_MS: 5000,
      ACTIVITY_LOG_QUEUE_LIMIT: 500,
      AGENT_WAKE_ENABLED: true,
      AGENT_BYPASS_PERMISSIONS: true,
      COORDINATOR_MAX_CONCURRENT_TASKS: 3,
      AGENT_MAX_REVIEW_ITERATIONS: 3,
      AGENT_USE_SUBAGENTS: true,
      TELEGRAM_BOT_TOKEN: undefined,
      TELEGRAM_USER_ID: undefined,
    }),
    logger: () => ({
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
    }),
  };
});

vi.mock("../hooks.js", () => ({
  createActivityLogger: () => async () => ({}),
  createSubagentLogger: () => async () => ({}),
  logActivity: logActivityMock,
  getClaudePath: () => "claude",
}));

vi.mock("../queryAudit.js", () => ({
  writeQueryAudit: () => undefined,
}));

vi.mock("../claudeDiagnostics.js", () => ({
  createClaudeStderrCollector: () => ({
    onStderr: () => undefined,
    getTail: () => "mock stderr",
  }),
  explainClaudeFailure: (err: unknown) => (err instanceof Error ? err.message : String(err)),
  probeClaudeCliFailure: async () => "",
}));

const { executeSubagentQuery } = await import("../subagentQuery.js");

function makeDelayedSuccess(delayMs: number, result: string) {
  return async function* () {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield {
      type: "result",
      subtype: "success",
      result,
      usage: {},
      total_cost_usd: 0,
    };
  };
}

function makeSuccessWithSession(sessionId: string, result: string) {
  return async function* () {
    yield {
      type: "system",
      subtype: "init",
      session_id: sessionId,
    };
    yield {
      type: "result",
      subtype: "success",
      result,
      usage: {},
      total_cost_usd: 0,
    };
  };
}

describe("executeSubagentQuery attribution", () => {
  beforeEach(() => {
    (globalThis as { __AIF_CLAUDE_QUERY_MOCK__?: typeof queryMock }).__AIF_CLAUDE_QUERY_MOCK__ =
      queryMock;
    queryMock.mockReset();
    logActivityMock.mockReset();
    incrementTaskTokenUsageMock.mockReset();
    saveTaskSessionIdMock.mockReset();
    getTaskSessionIdMock.mockReset();
    getTaskSessionIdMock.mockReturnValue(null);
  });

  it("passes empty attribution to suppress Co-Authored-By trailers", async () => {
    queryMock.mockImplementation(async function* () {
      yield {
        type: "result",
        subtype: "success",
        result: "done",
        usage: {},
        total_cost_usd: 0,
      };
    });

    await executeSubagentQuery({
      taskId: "task-attr",
      projectRoot: "/tmp/project",
      agentName: "implement-coordinator",
      prompt: "run",
      workflowKind: "implementer",
    });

    const callOptions = queryMock.mock.calls[0][0].options;
    expect(callOptions.settings).toEqual(
      expect.objectContaining({ attribution: { commit: "", pr: "" } }),
    );
  });
});

describe("executeSubagentQuery query_start_timeout retry", () => {
  const baseOptions = {
    taskId: "task-1",
    projectRoot: "/tmp/project",
    agentName: "implement-coordinator",
    prompt: "run",
    queryStartTimeoutMs: 10,
    queryStartRetryDelayMs: 0,
    workflowKind: "implementer",
  };

  beforeEach(() => {
    (globalThis as { __AIF_CLAUDE_QUERY_MOCK__?: typeof queryMock }).__AIF_CLAUDE_QUERY_MOCK__ =
      queryMock;
    queryMock.mockReset();
    logActivityMock.mockReset();
    incrementTaskTokenUsageMock.mockReset();
    saveTaskSessionIdMock.mockReset();
    getTaskSessionIdMock.mockReset();
    getTaskSessionIdMock.mockReturnValue(null);
  });

  it("retries once after query_start_timeout and succeeds on second attempt", async () => {
    queryMock
      .mockImplementationOnce(makeDelayedSuccess(40, "late-result"))
      .mockImplementationOnce(makeDelayedSuccess(0, "ok-second-attempt"));

    const result = await executeSubagentQuery(baseOptions);

    expect(result.resultText).toBe("ok-second-attempt");
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("throws when query_start_timeout happens on both attempts", async () => {
    queryMock
      .mockImplementationOnce(makeDelayedSuccess(40, "late-1"))
      .mockImplementationOnce(makeDelayedSuccess(40, "late-2"));

    await expect(executeSubagentQuery(baseOptions)).rejects.toThrow(/query_start_timeout/i);
    expect(queryMock).toHaveBeenCalledTimes(2);
  });
});

describe("executeSubagentQuery session persistence policy", () => {
  beforeEach(() => {
    (globalThis as { __AIF_CLAUDE_QUERY_MOCK__?: typeof queryMock }).__AIF_CLAUDE_QUERY_MOCK__ =
      queryMock;
    queryMock.mockReset();
    logActivityMock.mockReset();
    incrementTaskTokenUsageMock.mockReset();
    saveTaskSessionIdMock.mockReset();
    getTaskSessionIdMock.mockReset();
    getTaskSessionIdMock.mockReturnValue(null);
  });

  it("persists runtime session for resume_if_available workflows", async () => {
    queryMock.mockImplementation(makeSuccessWithSession("session-impl-1", "done"));

    await executeSubagentQuery({
      taskId: "task-resume",
      projectRoot: "/tmp/project",
      agentName: "implement-coordinator",
      prompt: "run",
      workflowKind: "implementer",
    });

    expect(saveTaskSessionIdMock).toHaveBeenCalledWith("task-resume", "session-impl-1");
  });

  it("does not persist runtime session for new_session workflows", async () => {
    queryMock.mockImplementation(makeSuccessWithSession("session-review-1", "done"));

    await executeSubagentQuery({
      taskId: "task-review",
      projectRoot: "/tmp/project",
      agentName: "review-sidecar",
      prompt: "run",
      workflowSpec: {
        workflowKind: "reviewer",
        promptInput: { prompt: "run" },
        requiredCapabilities: [],
        fallbackStrategy: "none",
        sessionReusePolicy: "new_session",
      },
    });

    expect(saveTaskSessionIdMock).not.toHaveBeenCalled();
  });
});
