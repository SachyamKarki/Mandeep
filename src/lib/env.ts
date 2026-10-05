import "server-only";

// All settings come from environment variables (.env.local in development).
// Nothing secret is written in the code. See .env.example for the full list.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

/** How the app connects to MySQL. */
export const dbConfig = {
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: required("DB_USER"),
  password: required("DB_PASSWORD"),
  database: process.env.DB_NAME ?? "mangaldeep_claims",
};

export const isProduction = process.env.NODE_ENV === "production";
