import { describe, expect, test } from "bun:test";
import Elysia from "elysia";

import { protobuf, protobufParser } from "../src";

import { pluginOpts, tags } from "./shared";
import { post } from "./utils";
import { RequestTags } from "./proto/general";

const validApp = new Elysia().use(protobufParser()).group("/test", (app) =>
  app.use(protobuf(pluginOpts)).post(
    "/a",
    async ({ body, decode, headers }) => {
      const data = await decode("tags.request", body, headers);
      return data.tags;
    },
    {
      parse: "protobuf",
    },
  ),
);

// ? maybe this error related with https://github.com/elysiajs/elysia/pull/1241
const invalidApp = new Elysia().group("/test", (app) =>
  app.use(protobuf(pluginOpts)).post(
    "/a",
    async ({ body, decode, headers }) => {
      const data = await decode("tags.request", body, headers);
      return data.tags;
    },
    {
      parse: "protobuf",
    },
  ),
);

const data = RequestTags.encode({
  tags,
}).finish();

describe("Multi instances", () => {
  test("success", async () => {
    const res = await validApp.handle(post("/test/a", data));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(tags);
  });
  test("parse error", async () => {
    const res = await invalidApp.handle(post("/test/a", data));
    expect(res.status).toBe(400);
    expect(await res.text()).toEqual("Bad Request");
  });
});
