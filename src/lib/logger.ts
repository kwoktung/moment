// Simple logger for Cloudflare Workers environment
// Winston's Console transport uses Node.js streams which are not fully supported in Workers

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMetadata {
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
}

class CloudflareLogger implements Logger {
  private level: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(level: LogLevel = "info") {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    meta?: LogMetadata,
  ): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...meta,
    };
    return JSON.stringify(logData);
  }

  debug(message: string, meta?: LogMetadata): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }

  info(message: string, meta?: LogMetadata): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, meta));
    }
  }

  warn(message: string, meta?: LogMetadata): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  error(message: string, meta?: LogMetadata): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, meta));
    }
  }
}

export const getLogger = (env: CloudflareEnv): Logger => {
  const level: LogLevel = env.NEXTJS_ENV === "production" ? "info" : "debug";
  return new CloudflareLogger(level);
};
