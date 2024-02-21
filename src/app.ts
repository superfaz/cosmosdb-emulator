import bodyParser from "body-parser";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { pinoHttp } from "pino-http";
import { ZodError, z } from "zod";
import { hashString, isErrorResponse } from "./helper";
import { rootLogger } from "./logger";
import container, { ContainerCreate } from "./services/container";
import database, { DatabaseCreate } from "./services/database";
import server from "./services/server";
import document, { DocumentCreate, DocumentQuery } from "./services/document";

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

app.delete("/dbs/:db", (req, res) => {
  const db = z.string().parse(req.params.db);
  const deleted = database.delete(db);
  res.status(deleted ? 204 : 404).send();
});

app.get("/dbs/:db/colls", (req, res) => {
  const db = z.string().parse(req.params.db);
  const collections = container.getAll(db);
  res.json({
    _rid: `${hashString(db)}`,
    DocumentCollections: collections,
    _count: collections.length,
  });
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

app.delete("/dbs/:db/colls/:coll", (req, res) => {
  const db = z.string().parse(req.params.db);
  const coll = z.string().parse(req.params.coll);
  const deleted = container.delete(db, coll);
  res.status(deleted ? 204 : 404).send();
});

app.get("/dbs/:db/colls/:coll/docs", (req, res) => {
  const db = z.string().parse(req.params.db);
  const coll = z.string().parse(req.params.coll);
  const documents = document.getAll(db, coll);
  res.json({
    _rid: `${hashString(coll)}`,
    Documents: documents,
    _count: documents.length,
  });
});

app.get("/dbs/:db/colls/:coll/docs/:doc", (req, res) => {
  const db = z.string().parse(req.params.db);
  const coll = z.string().parse(req.params.coll);
  const doc = z.string().parse(req.params.doc);
  const instance = document.getOne(db, coll, doc);
  if (isErrorResponse(instance)) {
    res.status(404);
  }

  res.json(instance);
});

app.delete("/dbs/:db/colls/:coll/docs/:doc", (req, res) => {
  const db = z.string().parse(req.params.db);
  const coll = z.string().parse(req.params.coll);
  const doc = z.string().parse(req.params.doc);
  const deleted = document.delete(db, coll, doc);
  res.status(deleted ? 204 : 404).send();
});

app.post("/dbs/:db/colls/:coll/docs", configuredBodyParser, (req, res) => {
  const db = z.string().parse(req.params.db);
  const coll = z.string().parse(req.params.coll);

  if (
    req.headers["x-ms-documentdb-isquery"] === "true" ||
    req.headers["x-ms-cosmos-is-query-plan-request"] === "True"
  ) {
    const request = DocumentQuery.parse(req.body);
    const documents = document.query(db, coll, request);
    if (isErrorResponse(documents)) {
      res.status(400).json(documents);
    } else {
      res.json({
        _rid: `${hashString(coll)}`,
        Documents: documents,
        _count: documents.length,
      });
    }
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

/**
 * Middleware to handle errors.
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    req.log.error("Invalid input" + JSON.stringify(error.errors, null, 2));
    res.status(400).json({
      code: "BadRequest",
      message: "Invalid input",
    });
  } else {
    req.log.fatal("Unknown error: " + JSON.stringify(error, null, 2));
    res.status(500).json({
      code: "InternalServerError",
      message: "An error occurred",
    });
  }
});

export default app;
