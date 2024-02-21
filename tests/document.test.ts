import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../src/app";
import { hashString } from "../src/helper";

describe("document", () => {
  const id = "test-document";
  const baseUrl = "/dbs/test/colls/test/docs";
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
      .post(baseUrl)
      .send({ id, data: "test-data" })
      .then((res) => {
        expect(res.body).toEqual(expected);
      });
  });

  test.skip("list", async () => {
    await request(app)
      .post(baseUrl)
      .send()
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual({
          _rid: "localhost",
          _count: expect.any(Number),
          Documents: expect.any(Array),
        });
        expect(res.body.Documents).toContainEqual(expected);
      });
  });

  test("get", async () => {
    await request(app)
      .get(baseUrl + "/test-document")
      .send()
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(expected);
      });
  });
});
