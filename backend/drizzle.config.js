import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Create a .env file with DATABASE_URL=postgresql://...");
}

export default defineConfig({
  out: "./migrations",
  schema: "./schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
