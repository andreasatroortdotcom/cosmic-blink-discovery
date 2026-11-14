import { APICallError } from "ai";

export function safeEvidenceError(error: unknown): string {
  if (APICallError.isInstance(error)) {
    try {
      const body = JSON.parse(error.responseBody ?? "{}");
      const message = body.error?.message ?? body.message;
      if (typeof message === "string") return message.slice(0, 600);
    } catch { /* No safe upstream JSON message. */ }
    return `AI evidence summary unavailable (status ${error.statusCode ?? "unknown"}). Export remains locked.`;
  }
  return "Couldn't generate the AI evidence summary. Export remains locked.";
}