import { drizzle } from "drizzle-orm/d1";
import { userTable, attachmentTable, postTable } from "./schema";
import { Logger } from "drizzle-orm/logger";
import { getLogger } from "@/lib/logger";

const formatSqlQuery = (query: { sql: string; params: unknown[] }) => {
  return query.sql.replace(/\$\d+/g, (match: string) => {
    const index = parseInt(match.slice(1));
    return JSON.stringify(query.params[index - 1]);
  });
};

class DrizzleLogger implements Logger {
  private readonly logger: ReturnType<typeof getLogger>;
  constructor(readonly env: CloudflareEnv) {
    this.logger = getLogger(env);
  }
  logQuery(query: string, params: unknown[]): void {
    this.logger.debug(formatSqlQuery({ sql: query, params }), {
      label: "drizzle-orm",
    });
  }

  splat(query: string, params: unknown[]): string {
    return formatSqlQuery({ sql: query, params });
  }
}

export interface DatabaseBindings {
  DB: D1Database;
}

export function getDatabase(env: CloudflareEnv) {
  return drizzle(env.DB, {
    schema: {
      userTable,
      attachmentTable,
      postTable,
    },
    logger: new DrizzleLogger(env),
  });
}

export type DatabaseClient = ReturnType<typeof getDatabase>;
