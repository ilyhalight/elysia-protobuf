import { describe, expect, test } from "bun:test";
import Elysia from "elysia";

import { protobuf, sign } from "../src";
import { SignatureOptions } from "../src/types/client";

import { tags } from "./shared";
import { post } from "./utils";
import { RequestTags } from "./proto/general";
import { TProtobuf } from "../src/type-system";

const signatureData = {
  enabled: true,
  headerName: "x-custom-signature",
  secret: "test123",
} as const satisfies SignatureOptions;

const nestedSignatureData = {
  enabled: true,
  headerName: "x-secret-signature",
  secret: "321tset",
} as const satisfies SignatureOptions;

const app = new Elysia()
  .use(
    protobuf({
      signature: signatureData,
    }),
  )
  .post(
    "/",
    async ({ body }) => {
      return body.tags;
    },
    {
      parse: "protobuf",
      body: TProtobuf(RequestTags),
    },
  )
  .group("/secret", (app) =>
    app
      .use(
        protobuf({
          signature: nestedSignatureData,
        }),
      )
      .post(
        "/",
        async ({ body }) => {
          return body.tags;
        },
        {
          parse: "protobuf",
          body: TProtobuf(RequestTags),
        },
      ),
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
    expect(res.status).toBe(400);
    expect(await res.text()).toEqual("Invalid signature");
  });
  test("missing header", async () => {
    const res = await app.handle(post("/", data));
    expect(res.status).toBe(400);
    expect(await res.text()).toEqual(
      `Missing ${signatureData.headerName} header in request`,
    );
  });
  test.failing("nested signature doesn't work", async () => {
    const signature = await sign(data, signatureData.secret);
    const res = await app.handle(
      post("/secret", data, {
        [signatureData.headerName]: signature,
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toEqual(
      `Missing ${nestedSignatureData.headerName} header in request`,
    );
  });
});
