import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/database/migrations",
  schema: "./src/database/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: "",
    databaseId: "17ea1884-a7c1-4019-b03c-7eabedebe0fa",
    token: "",
  },
});
