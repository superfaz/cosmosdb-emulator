import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { z } from "zod";
import { type ErrorResponse, hashString } from "../helper";

export const ContainerCreate = z
  .object({
    id: z.string(),
    partitionKey: z.object({
      paths: z.array(z.string()),
    }),
  })
  .strict();

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ContainerCreate = z.infer<typeof ContainerCreate>;

interface Path {
  path: string;
}
export interface Container {
  id: string;
  partitionKey: {
    paths: string[];
    kind: "Hash";
  };
  indexingPolicy: {
    indexingMode: "consistent";
    automatic: true;
    includedPaths: Path[];
    excludedPaths: Path[];
  };
  conflictResolutionPolicy: {
    mode: "LastWriterWins";
    conflictResolutionPath: "/_ts";
    conflictResolutionProcedure: "";
  };
  geospatialConfig: {
    type: "Geography";
  };
  _rid: string;
  _ts: number;
  _self: string;
  _etag: string;
  _colls: string;
  _users: string;
  _docs: string;
  _sprocs: string;
  _triggers: string;
  _udfs: string;
  _conflicts: string;
}

export function containerCreate(
  db: string,
  request: ContainerCreate
): Container {
  const dbHash = hashString(db);
  const idHash = hashString(request.id);

  const collection: Container = {
    id: request.id,
    partitionKey: {
      paths: request.partitionKey.paths,
      kind: "Hash",
    },
    indexingPolicy: {
      indexingMode: "consistent",
      automatic: true,
      includedPaths: [
        {
          path: "/*",
        },
      ],
      excludedPaths: [
        {
          path: '/"_etag"/?',
        },
      ],
    },
    conflictResolutionPolicy: {
      mode: "LastWriterWins",
      conflictResolutionPath: "/_ts",
      conflictResolutionProcedure: "",
    },
    geospatialConfig: {
      type: "Geography",
    },
    _rid: idHash,
    _ts: Math.floor(new Date().getTime() / 1000),
    _self: `dbs/${dbHash}/colls/${idHash}/`,
    _etag: randomUUID(),
    _colls: "colls/",
    _users: "users/",
    _docs: "docs/",
    _sprocs: "sprocs/",
    _triggers: "triggers/",
    _udfs: "udfs/",
    _conflicts: "conflicts/",
  };

  fs.mkdirSync(`./data/${dbHash}/colls`, { recursive: true });
  fs.writeFileSync(
    `./data/${dbHash}/colls/${idHash}.json`,
    JSON.stringify(collection, null, 2)
  );

  return collection;
}

export function containerGetOne(
  db: string,
  coll: string
): Container | ErrorResponse {
  const dbHash = hashString(db);
  const collHash = hashString(coll);
  if (fs.existsSync(`./data/${dbHash}/colls/${collHash}.json`)) {
    return JSON.parse(
      fs.readFileSync(`./data/${dbHash}/colls/${collHash}.json`, "utf-8")
    );
  } else {
    return {
      code: "NotFound",
      message: "Resource Not Found",
    };
  }
}

export default { create: containerCreate, getOne: containerGetOne };
