import { Elysia } from "elysia";

import type { ElysiaProtobufOptions } from "./types/client";
import { ProtoRequestError } from "./error";
import { sign, verify } from "./sign";
import { TProtobuf } from "./type-system";

const protobuf = (options: ElysiaProtobufOptions = {}) => {
  const {
    enabled: signatureEnabled = false,
    headerName: signatureHeaderName = "x-signature",
    secret: signatureSecret = "replaceme",
    showParseErrors = true,
  } = options.signature ?? {};

  return new Elysia({ name: "elysia-protobuf" })
    .onError(({ code, error, set }) => {
      if (!showParseErrors || code !== "PARSE") {
        return;
      }

      const cause = error.cause;
      if (cause instanceof ProtoRequestError) {
        set.status = cause.status;
        return cause.message;
      }
    })
    .parser("protobuf", async (ctx) => {
      if (ctx.contentType !== "application/x-protobuf") {
        return void 0;
      }

      const data = await ctx.request.arrayBuffer();
      const body = new Uint8Array(data);
      if (!signatureEnabled) {
        return body;
      }

      const signature = ctx.request.headers.get(signatureHeaderName);
      if (!signature) {
        throw new ProtoRequestError(
          `Missing ${signatureHeaderName} header in request`,
        );
      }

      if (!(await verify(signature, body, signatureSecret))) {
        throw new ProtoRequestError("Invalid signature");
      }

      return body;
    })
    .as("scoped");
};

export { sign, verify, TProtobuf, protobuf };
