import bodyParser from "body-parser";
import express from "express";
import { pinoHttp } from "pino-http";
import { ZodError, z } from "zod";
import { isErrorResponse } from "./helper";
import { rootLogger } from "./logger";
import { parseQuery } from "./parser";
import container, { ContainerCreate } from "./services/container";
import database, { DatabaseCreate } from "./services/database";
import server from "./services/server";
import document, { DocumentCreate } from "./services/document";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
app.disable("x-powered-by");

const configuredBodyParser = bodyParser.json({
  type: ["application/json", "application/query+json"],
});

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

/**
 * Middleware to handle errors.
 */
app.all("*", (req, res, next) => {
  try {
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      req.log.error("Invalid input", error.errors);
      res.status(400).json({
        code: "BadRequest",
        message: "Invalid input",
      });
    } else {
      req.log.fatal("Unknown error", error);
      res.status(500).json({
        code: "InternalServerError",
        message: "An error occurred",
      });
    }
  }
});

app.get("/", (req, res) => {
  res.json(server.info());
});

app.get("/dbs", (req, res) => {
  const databases = database.getAll();
  res.json({
    _rid: "localhost",
    Databases: databases,
    _count: databases.length,
  });
});

app.post("/dbs", configuredBodyParser, (req, res) => {
  const request = DatabaseCreate.parse(req.body);
  res.json(database.create(request));
});

app.get("/dbs/:db", (req, res) => {
  const db = z.string().parse(req.params.db);
  const instance = database.getOne(db);
  if (isErrorResponse(instance)) {
    res.status(404);
  }

  res.json(instance);
});

app.post("/dbs/:db/colls", configuredBodyParser, (req, res) => {
  const db = z.string().parse(req.params.db);
  const request = ContainerCreate.parse(req.body);
  res.json(container.create(db, request));
});

app.get("/dbs/:db/colls/:coll", (req, res) => {
  const db = z.string().parse(req.params.db);
  const coll = z.string().parse(req.params.coll);
  const instance = container.getOne(db, coll);
  if (isErrorResponse(instance)) {
    res.status(404);
  }

  res.json(instance);
});

const Query = z.object({
  query: z.string(),
});
app.post("/dbs/:db/colls/:coll/docs", configuredBodyParser, (req, res) => {
  const db = z.string().parse(req.params.db);
  const coll = z.string().parse(req.params.coll);

  req.log.info(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  if (
    req.headers["x-ms-documentdb-isquery"] === "true" ||
    req.headers["x-ms-cosmos-is-query-plan-request"] === "True"
  ) {
    const request = Query.parse(req.body);
    const query = parseQuery(request.query);
    res.log.info(query);

    res.json(document.getAll(db, coll));
  } else {
    const request = DocumentCreate.parse(req.body);
    res.json(document.create(db, coll, request));
  }
});

app.all("*", configuredBodyParser, (req, res, next) => {
  req.log.debug("Request received");
  req.log.debug(`${req.method} ${req.url}`);
  req.log.debug(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  req.log.debug(`Body: ${JSON.stringify(req.body, null, 2)}`);
  next();
});

/*
app.all("*", configuredBodyParser, async (req, res) => {
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
