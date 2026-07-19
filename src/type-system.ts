import { t, TSchema } from "elysia";

import type { MessageFns } from "./types/proto";
import { ProtoValidationError } from "./error";

export const TProtobuf = <T = unknown, Y extends TSchema = TSchema>(
  schema: MessageFns<T>,
  base: Y = t.Any() as Y,
) =>
  t
    .Transform(base)
    .Decode((v) => {
      try {
        return schema.decode(v as Uint8Array);
      } catch {
        throw new ProtoValidationError("Failed to decode protobuf body");
      }
    })
    .Encode((v) => {
      try {
        return new Response(schema.encode(v).finish(), {
          headers: {
            "content-type": "application/x-protobuf",
          },
        });
      } catch {
        throw new ProtoValidationError("Failed to encode protobuf body");
      }
    });
