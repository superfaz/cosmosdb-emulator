import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import bodyParser from "body-parser";
import express from "express";
import { pinoHttp } from "pino-http";
import { z } from "zod";
import { rootLogger } from "./logger";

function hashString(input: string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex").substring(0, 32);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();

app.use(
  pinoHttp({
    quietReqLogger: true,
    useLevel: "debug",
    logger: rootLogger,
  })
);

/**
 * Middleware to log all requests.
 */
app.all("*", (req, res, next) => {
  req.log.info("Received: %s %s", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.json({
    _self: "",
    id: "localhost",
    _rid: "localhost",
    media: "//media/",
    addresses: "//addresses/",
    _dbs: "//dbs/",
    writableLocations: [
      {
        name: "South Central US",
        databaseAccountEndpoint: "https://172.17.0.2:8081/",
      },
    ],
    readableLocations: [
      {
        name: "South Central US",
        databaseAccountEndpoint: "https://172.17.0.2:8081/",
      },
    ],
    enableMultipleWriteLocations: false,
    userReplicationPolicy: {
      asyncReplication: false,
      minReplicaSetSize: 1,
      maxReplicasetSize: 4,
    },
    userConsistencyPolicy: {
      defaultConsistencyLevel: "Session",
    },
    systemReplicationPolicy: {
      minReplicaSetSize: 1,
      maxReplicasetSize: 4,
    },
    readPolicy: {
      primaryReadCoefficient: 1,
      secondaryReadCoefficient: 1,
    },
    queryEngineConfiguration:
      '{"allowNewKeywords":true,"maxJoinsPerSqlQuery":10,"maxQueryRequestTimeoutFraction":0.9,"maxSqlQueryInputLength":524288,"maxUdfRefPerSqlQuery":10,"queryMaxInMemorySortDocumentCount":-1000,"spatialMaxGeometryPointCount":256,"sqlAllowNonFiniteNumbers":false,"sqlDisableOptimizationFlags":0,"enableSpatialIndexing":true,"maxInExpressionItemsCount":2147483647,"maxLogicalAndPerSqlQuery":2147483647,"maxLogicalOrPerSqlQuery":2147483647,"maxSpatialQueryCells":2147483647,"sqlAllowAggregateFunctions":true,"sqlAllowGroupByClause":true,"sqlAllowLike":true,"sqlAllowSubQuery":true,"sqlAllowScalarSubQuery":true,"sqlAllowTop":true}',
  });
});

app.get("/dbs", (req, res) => {
  fs.mkdirSync("./data", { recursive: true });
  const files = fs
    .readdirSync("./data")
    .filter((file) => file.endsWith(".json"));
  res.json({
    _rid: "localhost",
    Databases: files
      .map((file) => fs.readFileSync("./data/" + file, "utf-8"))
      .map((file) => JSON.parse(file)),
    _count: files.length,
  });
});

// Request:
// {
//   "id": "test-db"
// }
const Database = z
  .object({
    id: z.string(),
  })
  .strict();
app.post("/dbs", bodyParser.json(), (req, res) => {
  const result = Database.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      code: "BadRequest",
      message: "Invalid input",
    });
    return;
  }

  const request = result.data;
  const id = request.id;
  if (id === undefined) {
    res.status(400).json({ code: "Invalid", message: "id is required" });
  }

  const hash = hashString(request.id);
  const database = {
    id,
    _rid: hash,
    _self: `dbs/${hash}/`,
    _etag: randomUUID(),
    _colls: "colls/",
    _users: "users/",
    _ts: Math.floor(new Date().getTime() / 1000),
  };
  fs.mkdirSync("./data", { recursive: true });
  fs.writeFileSync(`./data/${hash}.json`, JSON.stringify(database, null, 2));

  res.json(database);
});

app.get("/dbs/:db", (req, res) => {
  const db = req.params.db;
  if (fs.existsSync(`./data/${db}.json`)) {
    res.json(JSON.parse(fs.readFileSync(`./data/${db}.json`, "utf-8")));
  } else {
    res.status(404).json({
      code: "NotFound",
      message: "Resource Not Found",
    });
  }
});

// Request:
// {
//   "id": "_migrations",
//   "partitionKey": {
//     "paths": [
//       "/id"
//     ]
//   }
// }
app.post("/dbs/:db/colls", bodyParser.json(), (req, res) => {
  const db = req.params.db;
  const id = req.body.id;

  const collection = {
    id,
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
    partitionKey: {
      paths: req.body.partitionKey.paths,
      kind: "Hash",
    },
    conflictResolutionPolicy: {
      mode: "LastWriterWins",
      conflictResolutionPath: "/_ts",
      conflictResolutionProcedure: "",
    },
    geospatialConfig: {
      type: "Geography",
    },
    _rid: id,
    _ts: Math.floor(new Date().getTime() / 1000),
    _self: `dbs/${db}/colls/${id}/`,
    _etag: randomUUID(),
    _docs: "docs/",
    _sprocs: "sprocs/",
    _triggers: "triggers/",
    _udfs: "udfs/",
    _conflicts: "conflicts/",
  };

  fs.mkdirSync(`./data/${db}/colls`, { recursive: true });
  fs.writeFileSync(
    `./data/${db}/colls/${id}.json`,
    JSON.stringify(collection, null, 2)
  );

  res.json(collection);
});

app.get("/dbs/:db/colls/:coll", (req, res) => {
  const db = req.params.db;
  const coll = req.params.coll;
  if (fs.existsSync(`./data/${db}/colls/${coll}.json`)) {
    res.json(
      JSON.parse(fs.readFileSync(`./data/${db}/colls/${coll}.json`, "utf-8"))
    );
  } else {
    res.status(404).json({
      code: "NotFound",
      message: "Resource Not Found",
    });
  }
});

// Request:
// {
//   "id": "20240110-update-classes-id"
// }
app.post("/dbs/:db/colls/:coll/docs", bodyParser.json(), (req, res) => {
  const db = req.params.db;
  const coll = req.params.coll;
  const id = req.body.id;
  const document = {
    ...req.body,
    _etag: randomUUID(),
    _rid: id,
    _self: `dbs/${db}/colls/${coll}/docs/${id}/`,
    _ts: Math.floor(new Date().getTime() / 1000),
    _attachments: "attachments/",
  };

  fs.mkdirSync(`./data/${db}/colls/${coll}/docs`, { recursive: true });
  fs.writeFileSync(
    `./data/${db}/colls/${coll}/docs/${id}.json`,
    JSON.stringify(document, null, 2)
  );

  res.json(document);
});

app.all("*", bodyParser.json(), (req, res, next) => {
  req.log.debug("Request received");
  req.log.debug(`${req.method} ${req.url}`);
  req.log.debug(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  req.log.debug(`Body: ${JSON.stringify(req.body, null, 2)}`);
  next();
});

/*
app.all("*", bodyParser.json(), async (req, res) => {
  const headers = {
    "x-ms-documentdb-responsecontinuationtokenlimitinkb": "1",
    "x-ms-documentdb-query-enablecrosspartition": "true",
    "cache-control": "no-cache",
    "x-ms-version": "2020-07-15",
    "user-agent": "Node.js/20.11.0 (win32; x64) azure-cosmos-js/4.0.0",
    "x-ms-cosmos-allow-tentative-writes": "true",
    "x-ms-date": req.headers["x-ms-date"] as string,
    accept: "application/json",
    authorization: req.headers.authorization as string,
    connection: "keep-alive",
    host: "localhost:8082",
  };

  if (req.headers["x-ms-documentdb-partitionkey"] !== undefined) {
    headers["x-ms-documentdb-partitionkey"] = req.headers[
      "x-ms-documentdb-partitionkey"
    ] as string;
  }

  if (req.headers["x-ms-documentdb-is-upsert"] !== undefined) {
    headers["x-ms-documentdb-is-upsert"] = req.headers[
      "x-ms-documentdb-is-upsert"
    ] as string;
  }

  const result = await fetch(`https://localhost:8082${req.url}`, {
    method: req.method,
    headers: headers,
    body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
  });

  const response = await result.json();
  req.log.debug("Response:", JSON.stringify(response, null, 2));

  res.statusCode = result.status;
  res.statusMessage = result.statusText;
  res.json(response);
});
*/

export default app;
