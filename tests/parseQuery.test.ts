/* eslint-disable sonarjs/no-duplicate-string */

import { describe, expect, test } from "vitest";
import { parseQuery } from "../src/parseQuery";

describe("parseQuery", () => {
  test("parses a simple query", () => {
    const query = "SELECT * FROM people";
    const result = parseQuery(query);
    expect(result).toEqual({
      success: true,
      columns: ["*"],
      tables: ["people"],
      filters: [],
      sorts: [],
    });
  });

  test("parses a multiple select", () => {
    const query = "SELECT people.id, test.id FROM people";
    const result = parseQuery(query);
    expect(result).toEqual({
      success: true,
      columns: ["people.id", "test.id"],
      tables: ["people"],
      filters: [],
      sorts: [],
    });
  });

  test("parses a WHERE clause", () => {
    const query = "SELECT people.name FROM people WHERE people.name = 'John'";
    const result = parseQuery(query);
    expect(result).toEqual({
      success: true,
      columns: ["people.name"],
      tables: ["people"],
      filters: ["people.name = 'John'"],
      sorts: [],
    });
  });

  test("parses a ORDER BY clause", () => {
    const query = "SELECT people.name FROM people ORDER BY people.name";
    const result = parseQuery(query);
    expect(result).toEqual({
      success: true,
      columns: ["people.name"],
      tables: ["people"],
      filters: [],
      sorts: ["people.name"],
    });
  });

  test("parses a ORDER BY complete clause ASC", () => {
    const query = "SELECT people.name FROM people ORDER BY people.name ASC";
    const result = parseQuery(query);
    expect(result).toEqual({
      success: true,
      columns: ["people.name"],
      tables: ["people"],
      filters: [],
      sorts: ["people.name"],
    });
  });

  test("parses a ORDER BY complete clause DESC", () => {
    const query = "SELECT people.name FROM people ORDER BY people.name DESC";
    const result = parseQuery(query);
    expect(result).toEqual({
      success: true,
      columns: ["people.name"],
      tables: ["people"],
      filters: [],
      sorts: ["people.name"],
    });
  });

  test("parses a standard query", () => {
    const query =
      "SELECT people.name FROM people WHERE people.name='John' ORDER BY people.name";
    const result = parseQuery(query);
    expect(result).toEqual({
      success: true,
      columns: ["people.name"],
      tables: ["people"],
      filters: ["people.name = 'John'"],
      sorts: ["people.name"],
    });
  });

  test("parses a select only query", () => {
    const query = "SELECT 'id'";
    const result = parseQuery(query);
    expect(result).toEqual({
      success: true,
      columns: ["'id'"],
      tables: [],
      filters: [],
      sorts: [],
    });
  });

  test("parses a query without WHERE clause", () => {
    const query = "SELECT * FROM c ORDER BY c.order";
    const result = parseQuery(query);
    expect(result).toEqual({
      success: true,
      columns: ["*"],
      tables: ["c"],
      filters: [],
      sorts: ["c.order"],
    });
  });
});
