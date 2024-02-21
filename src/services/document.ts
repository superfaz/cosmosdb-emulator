import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { z } from "zod";
import { hashString } from "../helper";

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

  return fs
    .readdirSync(`./data/${dbHash}/colls/${collHash}/docs`)
    .filter((file) => file.endsWith(".json"))
    .map((file) =>
      fs.readFileSync(
        `./data/${dbHash}/colls/${collHash}/docs/` + file,
        "utf-8"
      )
    )
    .map((file) => JSON.parse(file));
}

export default { create: documentCreate, getAll: documentGetAll };
