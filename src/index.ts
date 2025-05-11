import { Elysia, t } from "elysia";
import crypto from "node:crypto";

import type { ElysiaProtobufOptions, Schemas } from "./types/client";
import {
  RequestMessage,
  ResponseMessage,
  ResponseStatus,
} from "../example/src/proto/message";

export class ProtoResponseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ProtoRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const utf8Encoder = new TextEncoder();

export const getSignatureKey = async (secret: string) => {
  return await crypto.subtle.importKey(
    "raw",
    utf8Encoder.encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"],
  );
};

export const sign = async (
  data: crypto.webcrypto.BufferSource,
  secret: string,
) => {
  const key = await getSignatureKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return Buffer.from(signature).toString("hex");
};

export const verify = async (
  signature: string,
  data: crypto.webcrypto.BufferSource,
  secret: string,
) => {
  const key = await getSignatureKey(secret);
  const signatureData = new Uint8Array(Buffer.from(signature, "hex"));
  return await crypto.subtle.verify("HMAC", key, signatureData, data);
};

export const protobuf = <T extends Schemas>(
  options: ElysiaProtobufOptions<T> = {},
) => {
  const schemas = (options.schemas ?? {}) as T;
  const {
    enabled: signatureEnabled = false,
    headerName: signatureHeaderName = "x-signature",
    secret: signatureSecret = "replaceme",
  } = options.signature ?? {};
  return new Elysia({ name: "elysia-protobuf" })
    .parser("protobuf", async (ctx) => {
      if (ctx.contentType === "application/x-protobuf") {
        const data = await ctx.request.arrayBuffer();
        return new Uint8Array(data);
      }
    })
    .decorate(
      "decode",
      async <K extends keyof T>(
        name: K,
        body: unknown,
        headers: Record<string, string | undefined> = {},
      ) => {
        if (!(body instanceof Uint8Array)) {
          throw new ProtoResponseError("Request body must be Uint8Array");
        }

        if (signatureEnabled) {
          const signature = headers[signatureHeaderName];
          if (!signature) {
            throw new ProtoResponseError(
              `Missing ${signatureHeaderName} header in request`,
            );
          }

          if (!(await verify(signature, body, signatureSecret))) {
            throw new ProtoResponseError("Invalid signature");
          }
        }

        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return schemas[name].decode(body) as ReturnType<T[K]["decode"]>;
        } catch {
          throw new ProtoRequestError("Failed to decode protobuf body");
        }
      },
    )
    .macro({
      responseSchema: (name: keyof T) => ({
        afterHandle: ({ response, set }) => {
          if (!response || typeof response !== "object") {
            throw new ProtoResponseError("Response must be an object");
          }

          try {
            set.headers["content-type"] = "application/x-protobuf";
            return new Response(schemas[name].encode(response).finish());
          } catch {
            throw new ProtoResponseError("Failed to encode protobuf body");
          }
        },
      }),
    })
    .as("scoped");
};
