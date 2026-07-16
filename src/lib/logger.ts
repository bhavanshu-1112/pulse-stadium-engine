/**
 * @fileoverview Lightweight structured logging utility for the Pulse Stadium Engine.
 *
 * Replaces raw `console.*` calls with structured log entries that include
 * ISO 8601 timestamps and contextual tags. This improves log traceability
 * in production and provides a single point of control for log formatting.
 *
 * @module logger
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

/**
 * Formats and outputs a structured log entry to the console.
 *
 * @param level - The severity level of the log entry.
 * @param message - The primary log message.
 * @param context - Optional contextual metadata to attach to the log entry.
 */
function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
  };

  switch (level) {
    case 'ERROR':
      console.error(JSON.stringify(entry));
      break;
    case 'WARN':
      console.warn(JSON.stringify(entry));
      break;
    default:
      console.log(JSON.stringify(entry));
  }
}

/** Structured logger with `info`, `warn`, and `error` methods. */
export const logger = {
  /** Log an informational message. */
  info: (message: string, context?: Record<string, unknown>) => log('INFO', message, context),

  /** Log a warning (e.g., fallback activation, missing config). */
  warn: (message: string, context?: Record<string, unknown>) => log('WARN', message, context),

  /** Log an error with optional contextual metadata. */
  error: (message: string, context?: Record<string, unknown>) => log('ERROR', message, context),
};
