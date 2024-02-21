import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { z } from "zod";
import { type ErrorResponse, hashString } from "../helper";

export interface Database {
  id: string;
  _rid: string;
  _self: string;
  _etag: string;
  _ts: number;
  _colls: "colls/";
  _users: "users/";
}

export function databaseGetAll(): Database[] {
  fs.mkdirSync("./data", { recursive: true });
  const files = fs
    .readdirSync("./data")
    .filter((file) => file.endsWith(".json"));
  return files
    .map((file) => fs.readFileSync("./data/" + file, "utf-8"))
    .map((file) => JSON.parse(file));
}

export const DatabaseCreate = z
  .object({
    id: z.string(),
  })
  .strict();

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DatabaseCreate = z.infer<typeof DatabaseCreate>;

export function databaseCreate(request: DatabaseCreate): Database {
  const hash = hashString(request.id);
  const database: Database = {
    id: request.id,
    _rid: hash,
    _self: `dbs/${hash}/`,
    _etag: randomUUID(),
    _ts: Math.floor(new Date().getTime() / 1000),
    _colls: "colls/",
    _users: "users/",
  };

  fs.mkdirSync("./data", { recursive: true });
  fs.writeFileSync(`./data/${hash}.json`, JSON.stringify(database, null, 2));

  return database;
}

export function databaseGetOne(db: string): Database | ErrorResponse {
  const hash = hashString(db);
  if (fs.existsSync(`./data/${hash}.json`)) {
    return JSON.parse(fs.readFileSync(`./data/${hash}.json`, "utf-8"));
  } else {
    return {
      code: "NotFound",
      message: "Resource Not Found",
    };
  }
}

export default {
  getAll: databaseGetAll,
  create: databaseCreate,
  getOne: databaseGetOne,
};
