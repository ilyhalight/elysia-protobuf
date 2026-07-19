import { describe, expect, test } from "bun:test";
import Elysia from "elysia";

import { protobuf } from "../src";
import {
  encodedTags,
  RequestTagsSchema,
  ResponseTagsSchema,
  tags,
} from "./shared";
import { decodeTags, post } from "./utils";
import { RequestTags } from "./proto/general";

const tagsOut = tags.join(", ");

test("response should have content-type protobuf", async () => {
  const app = new Elysia().use(protobuf()).post(
    "/",
    async () => {
      return {
        inlineTags: "test",
      };
    },
    {
      response: ResponseTagsSchema,
      parse: "protobuf",
    },
  );

  const res = await app.handle(post("/"));

  expect(res).toHaveProperty("headers");
  expect(res.headers.get("content-type")).toBe("application/x-protobuf");
});

describe("Response with custom status code", () => {
  test("modern", async () => {
    const app = new Elysia().use(protobuf()).post(
      "/",
      async ({ status, body }) => {
        return status(201, {
          inlineTags: body.tags.join(", "),
          // @ts-expect-error Shows validation type error with TypeScript! (editor side)
          anyfield: "anyvalue",
        });
      },
      {
        body: RequestTagsSchema,
        response: {
          201: ResponseTagsSchema,
        },
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
    const out = await decodeTags(res);
    expect(out.inlineTags).toBe(tagsOut);
  });
  test("legacy", async () => {
    const app = new Elysia().use(protobuf()).post(
      "/",
      async ({ set, body }) => {
        set.status = 201;
        return {
          inlineTags: body.tags.join(", "),
          // no validation with Typescript, how sad :c
          anyfield: "anyvalue",
        };
      },
      {
        body: RequestTagsSchema,
        response: {
          201: ResponseTagsSchema,
        },
        parse: "protobuf",
      },
    );

    const res = await app.handle(post("/", encodedTags));

    expect(res.status).toBe(201);
    const out = await decodeTags(res);
    expect(out.inlineTags).toBe(tagsOut);
  });
  test.failing("skip new Response", async () => {
    const app = new Elysia().use(protobuf()).post(
      "/",
      async ({ body }) => {
        return new Response(
          JSON.stringify({
            inlineTags: body.tags.join(", "),
            anyfield: "anyvalue",
          }),
          {
            status: 201,
          },
        );
      },
      {
        body: RequestTagsSchema,
        response: {
          201: ResponseTagsSchema,
        },
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
    const out = await decodeTags(res);
    expect(out.inlineTags).toBe(tagsOut);
  });
});
