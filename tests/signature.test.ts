import { describe, expect, test } from "bun:test";
import Elysia from "elysia";

import { protobuf, sign } from "../src";
import { SignatureOptions } from "../src/types/client";

import { pluginOpts, tags } from "./shared";
import { post } from "./utils";
import { RequestTags } from "./proto/general";

const signatureData = {
  enabled: true,
  headerName: "x-custom-signature",
  secret: "test123",
} as const satisfies SignatureOptions;

const app = new Elysia()
  .use(
    protobuf({
      ...pluginOpts,
      signature: signatureData,
    }),
  )
  .post(
    "/",
    async ({ body, decode, headers }) => {
      const data = await decode("tags.request", body, headers);
      return data.tags;
    },
    {
      parse: "protobuf",
    },
  );
const data = RequestTags.encode({
  tags,
}).finish();

describe("Signature", () => {
  test("success verified", async () => {
    const signature = await sign(data, signatureData.secret);
    const res = await app.handle(
      post("/", data, {
        [signatureData.headerName]: signature,
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(tags);
  });
  test("invalid signature", async () => {
    const res = await app.handle(
      post("/", data, {
        [signatureData.headerName]: "random",
      }),
    );
    expect(res.status).toBe(500);
    expect(await res.text()).toEqual("Invalid signature");
  });
  test("missing header", async () => {
    const res = await app.handle(post("/", data));
    expect(res.status).toBe(500);
    expect(await res.text()).toEqual(
      `Missing ${signatureData.headerName} header in request`,
    );
  });
});
