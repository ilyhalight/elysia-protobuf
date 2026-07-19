import { expect, test } from "bun:test";
import Elysia from "elysia";

import { protobuf } from "../src";
import { ProtoRequestError } from "../src/error";
import { encodedTags } from "./shared";
import { post } from "./utils";

const app = new Elysia()
  .error({
    ProtoRequestError,
  })
  .onError(({ code, error, set }) => {
    if (code === "ProtoRequestError") {
      set.status = 418;
    }

    return {
      error: (error as Error).message,
    };
  })
  .use(protobuf())
  .post(
    "/",
    async () => {
      throw new ProtoRequestError("Just a test error");
    },
    {
      parse: "protobuf",
    },
  );

test("use plugin error outside with custom status/body", async () => {
  const res = await app.handle(post("/", encodedTags));
  expect(res.status).toBe(418);
  expect(await res.text()).toInclude("Just a test error");
});
