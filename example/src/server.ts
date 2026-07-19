import Elysia, { t } from "elysia";
import { protobuf, TProtobuf } from "elysia-protobuf";
import {
  RequestMessage,
  ResponseMessage,
  ResponseStatus,
} from "./proto/message";

const app = new Elysia()
  .use(
    protobuf({
      // (optional) verify body with signature
      signature: {
        enabled: true,
        secret: "changeme",
        headerName: "x-signature",
      },
    }),
  )
  .post(
    "/post",
    ({ body }) => {
      return {
        status: ResponseStatus.SOME,
        inlineTags: body.tags.join(", "),
      };
    },
    {
      parse: "protobuf",
      body: TProtobuf(RequestMessage),
      response: TProtobuf(ResponseMessage),
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
