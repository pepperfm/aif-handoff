import { logger } from "@aif/shared";

const log = logger("agent-notifier");

type BroadcastType = "task:updated" | "task:moved";

export interface TaskNotificationInfo {
  title?: string;
  fromStatus?: string;
  toStatus?: string;
}

async function sendTelegramNotification(taskId: string, info: TaskNotificationInfo): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const userId = process.env.TELEGRAM_USER_ID;
  if (!botToken || !userId) return;

  const title = info.title ?? taskId;
  const transition =
    info.fromStatus && info.toStatus
      ? `${info.fromStatus} → ${info.toStatus}`
      : (info.toStatus ?? "updated");

  const text = `📋 *${escapeMarkdown(title)}*\n${escapeMarkdown(transition)}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: userId,
        text,
        parse_mode: "MarkdownV2",
      }),
    });

    if (!res.ok) {
      log.debug({ taskId, status: res.status }, "Telegram notification failed");
    }
  } catch (err) {
    log.debug({ taskId, err }, "Telegram notification request failed");
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

export async function notifyTaskBroadcast(
  taskId: string,
  type: BroadcastType = "task:updated",
  info: TaskNotificationInfo = {},
): Promise<void> {
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3009}`;
  const url = `${baseUrl}/tasks/${taskId}/broadcast`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });

    if (!res.ok) {
      log.debug(
        { taskId, type, status: res.status },
        "Task broadcast request returned non-OK status",
      );
    }
  } catch (err) {
    // Broadcast is best-effort. Agent processing must not fail because API is unavailable.
    log.debug({ taskId, type, err }, "Task broadcast request failed");
  }

  // Best-effort Telegram notification — fire and forget.
  // Skip when status didn't actually change (e.g. implementing → implementing).
  if (type === "task:moved" && (!info.fromStatus || info.fromStatus !== info.toStatus)) {
    void sendTelegramNotification(taskId, info);
  }
}
