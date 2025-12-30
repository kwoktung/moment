// Simple logger for Cloudflare Workers environment
// Winston's Console transport uses Node.js streams which are not fully supported in Workers

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMetadata {
  [key: string]: unknown;
}

export type FormatMessageFunction = (
  level: LogLevel,
  message: string,
  meta?: LogMetadata,
) => string;

export interface Logger {
  debug(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
}

const defaultFormatMessage: FormatMessageFunction = (
  level: LogLevel,
  message: string,
  meta?: LogMetadata,
): string => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...meta,
  };
  return JSON.stringify(logData);
};

export const simpleFormatMessage: FormatMessageFunction = (
  level: LogLevel,
  message: string,
  meta?: LogMetadata,
): string => {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);
  let formatted = `[${timestamp}] [${levelUpper}] ${message}`;

  if (meta && Object.keys(meta).length > 0) {
    const metaString = Object.entries(meta)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(" ");
    formatted += ` ${metaString}`;
  }

  return formatted;
};

class CloudflareLogger implements Logger {
  private level: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  private formatMessageFn: FormatMessageFunction;

  constructor(level: LogLevel = "info", formatMessage?: FormatMessageFunction) {
    this.level = level;
    this.formatMessageFn = formatMessage || defaultFormatMessage;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  debug(message: string, meta?: LogMetadata): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessageFn("debug", message, meta));
    }
  }

  info(message: string, meta?: LogMetadata): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessageFn("info", message, meta));
    }
  }

  warn(message: string, meta?: LogMetadata): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessageFn("warn", message, meta));
    }
  }

  error(message: string, meta?: LogMetadata): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessageFn("error", message, meta));
    }
  }
}

export const getLogger = (env: CloudflareEnv): Logger => {
  const isProduction = env.NEXTJS_ENV === "production";
  const level: LogLevel = isProduction ? "info" : "debug";
  const formatMessageFn = isProduction
    ? defaultFormatMessage
    : simpleFormatMessage;
  return new CloudflareLogger(level, formatMessageFn);
};
