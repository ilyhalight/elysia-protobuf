import Elysia, { t } from "elysia";
import { protobuf, ProtoRequestError, ProtoResponseError } from "../../src";
import {
  RequestMessage,
  ResponseMessage,
  ResponseStatus,
} from "./proto/message";

const app = new Elysia()
  .use(
    protobuf({
      schemas: {
        "post.request": RequestMessage,
        "post.response": ResponseMessage,
      },
      // (optional) verify body with signature
      signature: {
        enabled: true,
        secret: "changeme",
        headerName: "x-signature",
      },
    }),
  )
  // (optional) error handling
  .error({
    PROTO_RESPONSE_ERROR: ProtoResponseError,
    PROTO_REQUEST_ERROR: ProtoRequestError,
  })
  .onError(({ code, error, set }) => {
    switch (code) {
      case "PROTO_REQUEST_ERROR": {
        set.status = 400;
        break;
      }
      case "PROTO_RESPONSE_ERROR": {
        set.status = 500;
        break;
      }
    }

    return {
      message: (error as Error).message,
    };
  })
  .post(
    "/post",
    async ({ body, decode, headers }) => {
      // decode uint8array with your schema
      const data = await decode("post.request", body, headers);
      return {
        status: ResponseStatus.SOME,
        inlineTags: data.tags.join(", "),
      };
    },
    {
      // parse body as arrayBuffer -> Uint8Array
      parse: "protobuf",
      // encode response with protobuf schema
      responseSchema: "post.response",
      // ! ❌ elysia validation INCOMPATIBLE with `parse: "protobuf"`
      // body: t.Object({
      //   title: t.String(),
      //   updatedAt: t.Optional(t.Number()),
      //   tags: t.Array(t.String()),
      // }),
      // Doubtful But Okay
      // body: t.Uint8Array(),
    },
  )
  .post(
    "/json",
    ({ body }) => {
      return body;
    },
    {
      // OK if parse mode isn't protobuf
      body: t.Object({
        title: t.String(),
        updatedAt: t.Optional(t.Number()),
        tags: t.Array(t.String()),
      }),
    },
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
