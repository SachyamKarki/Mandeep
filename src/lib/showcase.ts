import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

export type ShowcaseQuery = {
  slug: string;
  title: string;
  about: string;
  sql: string;
};

/** Reads database/04_queries.sql and splits it on its "-- @title:" markers. */
export function loadShowcaseQueries(): ShowcaseQuery[] {
  const file = readFileSync(path.join(process.cwd(), "database", "05_queries.sql"), "utf8");

  return file
    .split(/^-- @title:/m)
    .slice(1)
    .map((block) => {
      const lines = block.split("\n");
      const title = lines[0].trim();
      const aboutLine = lines.find((l) => l.startsWith("-- @about:")) ?? "";
      const sql = lines
        .slice(1)
        .filter((l) => !l.startsWith("-- @about:"))
        .join("\n")
        .trim();
      return {
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        title,
        about: aboutLine.replace("-- @about:", "").trim(),
        sql,
      };
    });
}
