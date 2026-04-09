import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type {
  RuntimeEvent,
  RuntimeSession,
  RuntimeSessionEventsInput,
  RuntimeSessionGetInput,
  RuntimeSessionListInput,
} from "../../types.js";

/**
 * Codex SDK persists threads in ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl.
 * This module reads persisted session metadata for the RuntimeAdapter session API.
 */

const SESSIONS_DIR = join(homedir(), ".codex", "sessions");
const SESSION_FILE_PATTERN =
  /(?:^|[/\\])rollout-[^/\\]*-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i;

interface CodexSessionMeta {
  id: string;
  model?: string;
  prompt?: string;
  cwd?: string;
  createdAt: string;
  updatedAt: string;
  filePath?: string;
}

function toIso(value: string | number | undefined): string {
  try {
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  } catch {
    // fall through
  }
  return new Date().toISOString();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function parseJsonLine(line: string): Record<string, unknown> | null {
  try {
    return asRecord(JSON.parse(line));
  } catch {
    return null;
  }
}

function sessionIdFromFilePath(filePath: string): string | null {
  const match = SESSION_FILE_PATTERN.exec(filePath);
  return match?.[1] ?? null;
}

function normalizePath(value: string | undefined): string | null {
  if (!value) return null;
  return value
    .replace(/[\\/]+/g, "/")
    .replace(/\/$/, "")
    .toLowerCase();
}

function mapToRuntimeSession(
  meta: CodexSessionMeta,
  profileId: string | null | undefined,
): RuntimeSession {
  return {
    id: meta.id,
    runtimeId: "codex",
    providerId: "openai",
    profileId: profileId ?? null,
    model: meta.model ?? null,
    title: meta.prompt?.slice(0, 80) ?? null,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    metadata: { raw: meta },
  };
}

async function listSessionFiles(dir: string): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSessionFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readSessionMetaFromFile(filePath: string): Promise<CodexSessionMeta | null> {
  const fallbackId = sessionIdFromFilePath(filePath);
  if (!fallbackId) return null;

  const info = await stat(filePath);
  let raw = "";
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return {
      id: fallbackId,
      createdAt: info.birthtime.toISOString(),
      updatedAt: info.mtime.toISOString(),
      filePath,
    };
  }

  let resolvedId = fallbackId;
  let createdAt = info.birthtime.toISOString();
  let model: string | undefined;
  let prompt: string | undefined;
  let cwd: string | undefined;

  for (const line of raw.split("\n")) {
    const entry = parseJsonLine(line);
    if (!entry) continue;

    if (readString(entry.type) === "session_meta") {
      const payload = asRecord(entry.payload);
      resolvedId = readString(payload?.id) ?? resolvedId;
      createdAt = toIso(
        (payload?.timestamp as string | number | undefined) ??
          (entry.timestamp as string | number | undefined),
      );
      cwd = readString(payload?.cwd) ?? cwd;
      model =
        readString(payload?.model) ??
        readString(payload?.model_slug) ??
        readString(payload?.modelId);
      continue;
    }

    if (readString(entry.type) === "event_msg") {
      const payload = asRecord(entry.payload);
      if (readString(payload?.type) === "user_message") {
        prompt = readString(payload?.message) ?? prompt;
        if (prompt) break;
      }
    }
  }

  return {
    id: resolvedId,
    model,
    prompt,
    cwd,
    createdAt,
    updatedAt: info.mtime.toISOString(),
    filePath,
  };
}

async function readSessionMetas(): Promise<CodexSessionMeta[]> {
  const sessionFiles = await listSessionFiles(SESSIONS_DIR);
  const sessions = (
    await Promise.all(sessionFiles.map((filePath) => readSessionMetaFromFile(filePath)))
  ).filter((session): session is CodexSessionMeta => Boolean(session));

  sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return sessions;
}

export async function listCodexSdkSessions(
  input: RuntimeSessionListInput,
): Promise<RuntimeSession[]> {
  const sessions = await readSessionMetas();
  const projectRoot = normalizePath(input.projectRoot);
  const filteredSessions = projectRoot
    ? sessions.filter((session) => normalizePath(session.cwd) === projectRoot)
    : sessions;
  const mapped = filteredSessions.map((session) => mapToRuntimeSession(session, input.profileId));
  return input.limit ? mapped.slice(0, input.limit) : mapped;
}

export async function getCodexSdkSession(
  input: RuntimeSessionGetInput,
): Promise<RuntimeSession | null> {
  const session = (await readSessionMetas()).find((meta) => meta.id === input.sessionId);
  return session ? mapToRuntimeSession(session, input.profileId) : null;
}

export async function listCodexSdkSessionEvents(
  input: RuntimeSessionEventsInput,
): Promise<RuntimeEvent[]> {
  const session = (await readSessionMetas()).find((meta) => meta.id === input.sessionId);
  if (!session?.filePath) {
    return [];
  }

  let lines: string[];
  try {
    const raw = await readFile(session.filePath, "utf-8");
    lines = raw.split("\n").filter((line) => line.trim().length > 0);
  } catch {
    return [];
  }

  const events: RuntimeEvent[] = [];
  for (const line of lines) {
    const entry = parseJsonLine(line);
    if (!entry || readString(entry.type) !== "event_msg") continue;

    const payload = asRecord(entry.payload);
    const payloadType = readString(payload?.type);
    const text = readString(payload?.message);
    if (!payloadType || !text) continue;

    if (payloadType === "agent_message") {
      const phase = readString(payload?.phase);
      if (phase && phase !== "final_answer") {
        continue;
      }
    }

    if (payloadType !== "user_message" && payloadType !== "agent_message") {
      continue;
    }

    events.push({
      type: "session-message",
      timestamp: toIso(entry.timestamp as string | number | undefined),
      level: "info",
      message: text,
      data: {
        role: payloadType === "user_message" ? "user" : "assistant",
        id: readString(payload?.turn_id) ?? readString(payload?.id),
      },
    });
  }

  return input.limit ? events.slice(-input.limit) : events;
}
