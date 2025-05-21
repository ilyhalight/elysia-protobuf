import { describe, expect, test } from "bun:test";
import Elysia from "elysia";

import { protobuf } from "../src";
import { pluginOpts, tags } from "./shared";
import { post } from "./utils";
import { RequestTags, ResponseTags } from "./proto/general";

const tagsOut = tags.join(", ");

describe("Custom status code", () => {
  test("legacy", async () => {
    const app = new Elysia().use(protobuf(pluginOpts)).post(
      "/",
      async ({ set, decode, body }) => {
        const data = await decode("tags.request", body);
        set.status = 201;
        return {
          inlineTags: data.tags.join(", "),
        };
      },
      {
        responseSchema: "tags.response",
        parse: "protobuf",
      },
    );

    const res = await app.handle(
      post(
        "/",
        RequestTags.encode({
          tags,
        }).finish(),
      ),
    );

    expect(res.status).toBe(201);
    const response = await res.arrayBuffer();
    const out = ResponseTags.decode(new Uint8Array(response));
    expect(out.inlineTags).toBe(tagsOut);
  });
  test("modern", async () => {
    const app = new Elysia().use(protobuf(pluginOpts)).post(
      "/",
      async ({ status, decode, body }) => {
        const data = await decode("tags.request", body);
        return status(201, {
          inlineTags: data.tags.join(", "),
        });
      },
      {
        responseSchema: "tags.response",
        parse: "protobuf",
      },
    );

    const res = await app.handle(
      post(
        "/",
        RequestTags.encode({
          tags,
        }).finish(),
      ),
    );

    expect(res.status).toBe(201);
    const response = await res.arrayBuffer();
    const out = ResponseTags.decode(new Uint8Array(response));
    expect(out.inlineTags).toBe(tagsOut);
  });
  test("response", async () => {
    const app = new Elysia().use(protobuf(pluginOpts)).post(
      "/",
      async ({ decode, body }) => {
        const data = await decode("tags.request", body);
        return new Response(
          JSON.stringify({
            inlineTags: data.tags.join(", "),
          }),
          {
            status: 201,
          },
        );
      },
      {
        responseSchema: "tags.response",
        parse: "protobuf",
      },
    );

    const res = await app.handle(
      post(
        "/",
        RequestTags.encode({
          tags,
        }).finish(),
      ),
    );

    expect(res.status).toBe(201);
    const response = await res.arrayBuffer();
    const out = ResponseTags.decode(new Uint8Array(response));
    expect(out.inlineTags).toBe(tagsOut);
  });
});
