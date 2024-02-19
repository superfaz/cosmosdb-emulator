import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../src/app";
import { hashString } from "../src/helper";

describe("document", () => {
  const id = "test-document";
  const expected = {
    id,
    data: "test-data",
    _rid: hashString(id),
    _self: `dbs/${hashString("test")}/colls/${hashString("test")}/docs/${hashString("test-document")}/`,
    _etag: expect.any(String),
    _ts: expect.any(Number),
    _attachments: "attachments/",
  };

  test("create", async () => {
    await request(app)
      .post("/dbs/test/colls/test/docs")
      .send({ id: "test-document", data: "test-data" })
      .then((res) => {
        expect(res.body).toEqual(expected);
      });
  });

  test.skip("list", async () => {
    await request(app)
      .get("/dbs/test/colls/test/docs")
      .send()
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual({
          _rid: "localhost",
          _count: expect.any(Number),
          Databases: expect.any(Array),
        });
        expect(res.body.Databases).toContainEqual(expected);
      });
  });

  test.skip("get", async () => {
    await request(app)
      .get("/dbs/test/colls/test/docs/test-document")
      .send()
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(expected);
      });
  });
});
