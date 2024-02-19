import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("database", () => {
  const expected = {
    id: "test-db",
    _rid: "test-db",
    _self: "dbs/test-db/",
    _etag: expect.any(String),
    _colls: "colls/",
    _users: "users/",
    _ts: expect.any(Number),
  };

  test("create", async () => {
    await request(app)
      .post("/dbs")
      .send({ id: "test-db" })
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(expected);
      });
  });

  test("list", async () => {
    await request(app)
      .get("/dbs")
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

  test("get", async () => {
    await request(app)
      .get("/dbs/test-db")
      .send()
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(expected);
      });
  });
});
