import { Elysia } from "elysia";
import crypto from "node:crypto";

import type { ElysiaProtobufOptions, Schemas } from "./types/client";
import { ElysiaCustomStatusResponse } from "elysia/error";
import { MessageFns } from "./types/proto";

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

function handleResponseBody(
  responseBody: unknown,
  responseSchema: MessageFns<any>,
): Response {
  if (!responseBody || typeof responseBody !== "object") {
    throw new ProtoResponseError("Response must be an object");
  }
  if (Object.keys(responseBody).length === 0) {
    return new Response();
  }
  try {
    return new Response(responseSchema.encode(responseBody).finish());
  } catch {
    throw new ProtoResponseError("Failed to encode protobuf body");
  }
}

function isElysiaCustomStatusResponse(
  obj: unknown,
): obj is ElysiaCustomStatusResponse<any, any> {
  return obj?.constructor?.name === "ElysiaCustomStatusResponse";
}

function isResponse(obj: unknown): obj is Response {
  return obj instanceof Response;
}

export const protobufParser = () =>
  new Elysia()
    .parser("protobuf", async (ctx) => {
      if (ctx.contentType === "application/x-protobuf") {
        const data = await ctx.request.arrayBuffer();
        return new Uint8Array(data);
      }
    })
    .as("scoped");

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
    .use(protobufParser())
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
        afterHandle: async ({ response, set, status }) => {
          if (!response || typeof response !== "object") {
            throw new ProtoResponseError("Response must be an object");
          }
          set.headers["content-type"] = "application/x-protobuf";

          if (isElysiaCustomStatusResponse(response)) {
            return status(
              response.code,
              handleResponseBody(response.response, schemas[name]),
            );
          }
          if (isResponse(response)) {
            try {
              const data = await response.json();
              return new Response(
                handleResponseBody(data, schemas[name]).body,
                response,
              );
            } catch {
              throw new ProtoResponseError("Invalid response body");
            }
          }

          return handleResponseBody(response, schemas[name]);
        },
      }),
    })
    .as("scoped");
};
