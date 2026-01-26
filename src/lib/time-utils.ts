/**
 * Time formatting utilities for Floorp OS Automator
 * Consolidates duplicate time formatting functions across the codebase
 */

/**
 * Protobuf timestamp type
 */
export type ProtobufTimestamp = { seconds: bigint; nanos: number };

/**
 * Format a protobuf timestamp to a localized date string
 *
 * @param timestamp - Protobuf timestamp object
 * @param locale - Locale string (e.g., "ja-JP", "en-US")
 * @param includeSeconds - Whether to include seconds in the output
 * @returns Formatted date string or empty string if timestamp is undefined
 *
 * @example
 * ```ts
 * formatTimestamp({ seconds: 1737873600n, nanos: 0 }, "ja-JP")
 * // Returns: "2025/01/26 12:00"
 * ```
 */
export function formatTimestamp(
  timestamp: ProtobufTimestamp | undefined,
  locale: string = "ja-JP",
  includeSeconds: boolean = false,
): string {
  if (!timestamp) return "";

  const date = new Date(Number(timestamp.seconds) * 1000);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds && { second: "2-digit" }),
  };

  // Map short locale codes to full locale codes
  const fullLocale = locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : locale;

  return date.toLocaleString(fullLocale, options);
}

/**
 * Format a protobuf timestamp to a relative time string (e.g., "2 hours ago")
 *
 * @param timestamp - Protobuf timestamp object
 * @param t - i18n translation function
 * @param locale - Locale string for fallback formatting
 * @returns Relative time string or empty string if timestamp is undefined
 *
 * @example
 * ```ts
 * formatRelativeTimestamp(
 *   { seconds: 1737873600n, nanos: 0 },
 *   (key, opts) => `${opts?.count || 0} ${key}`
 * )
 * // Returns: "2 hours ago" (or localized equivalent)
 * ```
 */
export function formatRelativeTimestamp(
  timestamp: ProtobufTimestamp | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string = "ja",
): string {
  if (!timestamp) return "";

  const now = Date.now();
  const date = Number(timestamp.seconds) * 1000;
  const diffInSeconds = Math.floor((now - date) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return t("common.time.justNow");
  }

  // Minutes (less than an hour)
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return t("common.time.minutesAgo", { count: minutes });
  }

  // Hours (less than a day)
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return t("common.time.hoursAgo", { count: hours });
  }

  // Days (less than a week)
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return t("common.time.daysAgo", { count: days });
  }

  // Fallback to absolute date for older timestamps
  return formatTimestamp(timestamp, locale === "ja" ? "ja-JP" : "en-US");
}

/**
 * Format duration in milliseconds to a human-readable string
 *
 * @param ms - Duration in milliseconds
 * @param locale - Locale string for localized units
 * @returns Formatted duration string
 *
 * @example
 * ```ts
 * formatDuration(500) // Returns: "500ms"
 * formatDuration(1500) // Returns: "1.5秒" or "1.5s" depending on locale
 * formatDuration(65000) // Returns: "1分 5秒"
 * ```
 */
export function formatDuration(ms: number, locale: string = "ja"): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  if (ms < 60000) {
    const seconds = (ms / 1000).toFixed(1);
    if (locale === "ja") {
      return `${seconds}秒`;
    }
    return `${seconds}s`;
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (locale === "ja") {
    return seconds > 0 ? `${minutes}分 ${seconds}秒` : `${minutes}分`;
  }
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

/**
 * Calculate the difference between two timestamps in milliseconds
 *
 * @param start - Start timestamp
 * @param end - End timestamp (defaults to current time)
 * @returns Duration in milliseconds
 */
export function calculateDuration(
  start: ProtobufTimestamp,
  end?: ProtobufTimestamp,
): number {
  const startTime = Number(start.seconds) * 1000 + start.nanos / 1_000_000;
  const endTime = end
    ? Number(end.seconds) * 1000 + end.nanos / 1_000_000
    : Date.now();
  return endTime - startTime;
}
