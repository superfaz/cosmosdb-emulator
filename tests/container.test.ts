import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../src/app";
import { hashString } from "../src/helper";

describe("container", () => {
  const id = "test-container";
  const expected = {
    id,
    _rid: hashString(id),
    _self: `dbs/${hashString("test")}/colls/${hashString(id)}/`,
    _etag: expect.any(String),
    _ts: expect.any(Number),
    partitionKey: {
      paths: ["/id"],
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
    _colls: "colls/",
    _users: "users/",
    _docs: "docs/",
    _sprocs: "sprocs/",
    _triggers: "triggers/",
    _udfs: "udfs/",
    _conflicts: "conflicts/",
  };

  test("create", async () => {
    await request(app)
      .post("/dbs/test/colls")
      .send({ id: "test-container", partitionKey: { paths: ["/id"] } })
      .then((res) => {
        expect(res.body).toEqual(expected);
      });
  });

  test("list", async () => {
    await request(app)
      .get("/dbs/test/colls")
      .send()
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual({
          _rid: hashString("test"),
          _count: expect.any(Number),
          DocumentCollections: expect.any(Array),
        });
        expect(res.body.DocumentCollections).toContainEqual(expected);
      });
  });

  test("get", async () => {
    await request(app)
      .get("/dbs/test/colls/test-container")
      .send()
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(expected);
      });
  });
});
