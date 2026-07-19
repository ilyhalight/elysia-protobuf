import { describe, expect, test } from "bun:test";
import Elysia, { t } from "elysia";

import { protobuf } from "../src";

import { encodedTags, tags } from "./shared";
import { post } from "./utils";
import { RequestTags } from "./proto/general";
import { TProtobuf } from "../src/type-system";

const app = new Elysia().use(protobuf()).group("/test", (app) =>
  app
    .post("/a", async ({ body }) => body.tags, {
      parse: "protobuf",
      body: TProtobuf(RequestTags),
    })
    .post("/text", async ({ body }) => body.tags, {
      body: t.Object({
        tags: t.Array(t.String()),
      }),
    }),
);

// ? maybe this error related with https://github.com/elysiajs/elysia/pull/1241
const invalidApp = new Elysia().group("/test", (app) =>
  app.use(protobuf()).post("/a", async ({ body }) => body.tags, {
    body: TProtobuf(RequestTags),
    parse: "protobuf",
  }),
);

describe("Body parsing", () => {
  test("success", async () => {
    const res = await app.handle(post("/test/a", encodedTags));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(tags);
  });
  test("parser error", async () => {
    const res = await invalidApp.handle(post("/test/a", encodedTags));
    expect(res.status).toBe(400);
    expect(await res.text()).toEqual("Bad Request");
  });
  test("parse validation error", async () => {
    const res = await app.handle(
      post("/test/a", new Uint8Array([1232132131231233])),
    );
    expect(res.status).toBe(422);
    expect(await res.text()).toEqual("Failed to decode protobuf body");
  });
  test("[compatibility check] typebox schema with json parser should work as usual", async () => {
    const resText = await app.handle(
      post("/test/text", JSON.stringify({ tags }) as any, {
        "Content-Type": "application/json",
      }),
    );
    expect(resText.status).toBe(200);
    expect(await resText.json()).toEqual(tags);
  });
});
