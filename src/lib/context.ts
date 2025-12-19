import { getDatabase, type DatabaseClient } from "@/database/client";
import { getLogger } from "./logger";

type Logger = ReturnType<typeof getLogger>;

export type Context = {
  env: CloudflareEnv;
  logger: Logger;
  db: DatabaseClient;
};

export const createContext = (env: CloudflareEnv): Context => {
  return {
    env,
    logger: getLogger(env),
    db: getDatabase(env),
  };
};
