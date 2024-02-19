import { describe, test } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("app", () => {
  test("should work", async () => {
    const body = await import("./app-body.json");
    await request(app).get("/").expect(200, body.default);
  });
});
