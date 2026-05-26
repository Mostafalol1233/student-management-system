import type { NotificationType } from "./notifications";

export const notificationTypeConfig: Record<NotificationType, { emoji: string; color: string }> = {
  success: { emoji: "✅", color: "text-emerald-600 dark:text-emerald-400" },
  warning: { emoji: "⚠️", color: "text-amber-600 dark:text-amber-400" },
  error: { emoji: "❌", color: "text-red-600 dark:text-red-400" },
  payment: { emoji: "💰", color: "text-violet-600 dark:text-violet-400" },
  homework: { emoji: "📚", color: "text-blue-600 dark:text-blue-400" },
  session: { emoji: "🏫", color: "text-cyan-600 dark:text-cyan-400" },
  info: { emoji: "ℹ️", color: "text-muted-foreground" },
};
