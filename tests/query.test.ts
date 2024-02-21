import { beforeAll, describe, expect, test } from "vitest";
import request from "supertest";
import app from "../src/app";
import { hashString } from "../src/helper";

describe("document query", () => {
  const baseUrl = "/dbs/test/colls/test-query/docs";

  const data = [
    {
      id: "1",
      data: "ccc",
      order: 3,
    },
    {
      id: "2",
      data: "bbb",
      order: 2,
    },
    {
      id: "3",
      data: "aaa",
      order: 1,
    },
  ];

  const baseExcepted = {
    _etag: expect.any(String),
    _ts: expect.any(Number),
    _attachments: "attachments/",
  };
  const expected = [
    {
      ...baseExcepted,
      ...data[0],
      _rid: hashString("1"),
      _self: `dbs/${hashString("test")}/colls/${hashString("test")}/docs/${hashString("1")}/`,
    },
    {
      ...baseExcepted,
      ...data[1],
      _rid: hashString("2"),
      _self: `dbs/${hashString("test")}/colls/${hashString("test")}/docs/${hashString("2")}/`,
    },
    {
      ...baseExcepted,
      ...data[2],
      _rid: hashString("3"),
      _self: `dbs/${hashString("test")}/colls/${hashString("test")}/docs/${hashString("3")}/`,
    },
  ];

  beforeAll(async () => {
    await request(app)
      .post("/dbs/test/colls")
      .send({ id: "test-query", partitionKey: { paths: ["/id"] } })
      .expect(200);

    for (const doc of data) {
      await request(app).post(baseUrl).send(doc).expect(200);
    }
  });

  test.skip("simple query", async () => {
    await request(app)
      .post(baseUrl)
      .set("content-type", "application/query+json")
      .set("x-ms-documentdb-isquery", "true")
      .send({ query: "select * from c" })
      .then((res) => {
        expect(res.body).toHaveLength(3);
        expect(res.body).toContainEqual(expected[0]);
        expect(res.body).toContainEqual(expected[1]);
        expect(res.body).toContainEqual(expected[2]);
      });
  });
});
