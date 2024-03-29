import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { z } from "zod";
import { type ErrorResponse, hashString } from "../helper";
import { parseQuery } from "../parser";

export const DocumentCreate = z.custom<{
  [key: string]: unknown;
  id: string;
}>((data) => {
  return z.record(z.string(), z.unknown()).safeParse(data).success;
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DocumentCreate = z.infer<typeof DocumentCreate>;

export interface Document extends Record<string, unknown> {
  id: string;
  _etag: string;
  _rid: string;
  _self: string;
  _ts: number;
  _attachments: string;
}

export function documentCreate(
  db: string,
  coll: string,
  request: DocumentCreate
): Document {
  const dbHash = hashString(db);
  const collHash = hashString(coll);
  const idHash = hashString(request.id);

  const document = {
    ...request,
    _etag: randomUUID(),
    _rid: idHash,
    _self: `dbs/${dbHash}/colls/${collHash}/docs/${idHash}/`,
    _ts: Math.floor(new Date().getTime() / 1000),
    _attachments: "attachments/",
  };

  fs.mkdirSync(`./data/${dbHash}/colls/${collHash}/docs`, {
    recursive: true,
  });
  fs.writeFileSync(
    `./data/${dbHash}/colls/${collHash}/docs/${idHash}.json`,
    JSON.stringify(document, null, 2)
  );

  return document;
}

export function documentGetAll(db: string, coll: string): Document[] {
  const dbHash = hashString(db);
  const collHash = hashString(coll);
  const basePath = `./data/${dbHash}/colls/${collHash}/docs/`;

  fs.mkdirSync(basePath, { recursive: true });
  return fs
    .readdirSync(basePath)
    .filter((file) => file.endsWith(".json"))
    .map((file) => fs.readFileSync(basePath + file, "utf-8"))
    .map((file) => JSON.parse(file));
}

export function documentGetOne(
  db: string,
  coll: string,
  id: string
): Document | ErrorResponse {
  const dbHash = hashString(db);
  const collHash = hashString(coll);
  const idHash = hashString(id);
  const path = `./data/${dbHash}/colls/${collHash}/docs/${idHash}.json`;

  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, "utf-8"));
  } else {
    return {
      code: "NotFound",
      message: "Resource Not Found",
    };
  }
}

export const DocumentQuery = z.object({
  query: z.string(),
});

function sortDocument(a: Document, b: Document, sort: string): number {
  const asort: unknown = a[sort];
  const bsort: unknown = b[sort];
  if (asort === undefined || bsort === undefined) {
    throw new Error("Invalid sort");
  }
  if (typeof asort === "number" && typeof bsort === "number") {
    return bsort - asort;
  }
  if (typeof asort === "string" && typeof bsort === "string") {
    return asort.localeCompare(bsort);
  }

  throw new Error("Invalid sort");
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DocumentQuery = z.infer<typeof DocumentQuery>;

export function documentQuery(
  db: string,
  coll: string,
  request: DocumentQuery
): Document[] | ErrorResponse {
  const query = parseQuery(request.query);

  // Validate the query
  if (!query.success) {
    console.error(query.message);
    return { code: "InvalidQuery", message: "Query can't be parsed" };
  }

  if (
    query.tables.length !== 1 ||
    query.columns.length !== 1 ||
    query.columns[0] !== "*"
  ) {
    console.error("Invalid query", query);
    return { code: "InvalidQuery", message: "Invalid query" };
  }

  // Execute the query
  let documents = documentGetAll(db, coll);

  for (const sort of query.sorts) {
    const cleanSort = sort
      .substring(sort.indexOf(".") + 1)
      .substring(sort.indexOf("['") + 1)
      .replace(/['\]]/g, "");
    documents = documents.sort((a, b) => sortDocument(a, b, cleanSort));
  }

  return documents;
}

export function documentDelete(db: string, coll: string, doc: string): boolean {
  const dbHash = hashString(db);
  const collHash = hashString(coll);
  const docHash = hashString(doc);
  const basePath = `./data/${dbHash}/colls/${collHash}/docs/${docHash}`;

  if (fs.existsSync(basePath + ".json")) {
    fs.rmSync(basePath + ".json");
    return true;
  } else {
    return false;
  }
}

export default {
  create: documentCreate,
  delete: documentDelete,
  getAll: documentGetAll,
  getOne: documentGetOne,
  query: documentQuery,
};
