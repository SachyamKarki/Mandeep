// Creates the mangaldeep_claims database from the SQL files in /database.
// Run with: npm run db:setup  (drops and recreates the database)
// Login accounts are kept across resets; everything else goes back to the dummy data.
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.warn("No .env.local found, using environment variables.");
}

const DB = process.env.DB_NAME ?? "mangaldeep_claims";

// Passwords come only from .env.local (or the environment), never from this file.
for (const name of ["DB_USER", "DB_PASSWORD"]) {
  if (!process.env[name]) {
    console.error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
    process.exit(1);
  }
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  // Schema owner (see database/06_access.sql); falls back to the app account.
  user: process.env.DB_SETUP_USER ?? process.env.DB_USER,
  password: process.env.DB_SETUP_PASSWORD ?? process.env.DB_PASSWORD,
  multipleStatements: true,
  dateStrings: true,
});

const read = (file) => readFileSync(new URL(`../database/${file}`, import.meta.url), "utf8");

const run = async (file) => {
  await conn.query(read(file));
  console.log(`✓ ${file}`);
};

// Sends a file one statement at a time. In a multi-statement batch MySQL keeps each
// trigger's closing ";" in the stored body, and mysqldump backups then fail to restore.
// Every statement in 04_audit.sql ends with ";" at the end of a line.
const runEach = async (file) => {
  const statements = read(file)
    .split(/;[ \t]*$/m)
    .map((s) => s.trim())
    .filter((s) => s.replace(/^--.*$/gm, "").trim());
  for (const sql of statements) await conn.query(sql);
  console.log(`✓ ${file}`);
};

try {
  // Keep existing accounts (if any) so a reset does not lock everyone out.
  let users = [];
  try {
    [users] = await conn.query(`SELECT * FROM \`${DB}\`.app_user`);
  } catch {
    // first run: no database or no app_user table yet
  }

  await run("01_schema.sql");
  await run("02_seed.sql");
  await run("03_views.sql");

  if (users.length) {
    // admin_slot is a generated column, so MySQL fills it in.
    const cols = Object.keys(users[0]).filter((c) => c !== "admin_slot");
    await conn.query(`INSERT INTO app_user (${cols.join(", ")}) VALUES ?`, [users.map((u) => cols.map((c) => u[c]))]);
    console.log(`✓ kept ${users.length} login ${users.length === 1 ? "account" : "accounts"} (sessions were cleared)`);
  }

  // Audit triggers go in last, so the log starts empty.
  await runEach("04_audit.sql");

  const [rows] = await conn.query(
    `SELECT
       (SELECT COUNT(*) FROM insurer)    AS insurers,
       (SELECT COUNT(*) FROM client)     AS clients,
       (SELECT COUNT(*) FROM surveyor)   AS surveyors,
       (SELECT COUNT(*) FROM claim)      AS claims,
       (SELECT COUNT(*) FROM site_visit) AS site_visits,
       (SELECT COUNT(*) FROM invoice)    AS invoices,
       (SELECT COUNT(*) FROM app_user)   AS users,
       (SELECT COUNT(*) FROM information_schema.TRIGGERS
          WHERE TRIGGER_SCHEMA = DATABASE()) AS triggers`,
  );
  console.table(rows);
  if (!users.length) console.log("\nNo login accounts yet: open the app and create the first admin at /register.");
} catch (err) {
  if (err.code === "ER_BINLOG_CREATE_ROUTINE_NEED_SUPER") {
    console.error(
      "\n✗ MySQL would not create the audit triggers because binary logging is on.\n" +
        "  Everything else is set up. Run this once as MySQL root, then run npm run db:setup again:\n\n" +
        '    mysql -u root -p -e "SET PERSIST log_bin_trust_function_creators = 1;"\n',
    );
    process.exitCode = 1;
  } else {
    throw err;
  }
} finally {
  await conn.end();
}
