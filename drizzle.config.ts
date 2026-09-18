import type { Config } from "drizzle-kit";
import "./scripts/env.ts";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Fill it in in .env.local.");
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
} satisfies Config;
