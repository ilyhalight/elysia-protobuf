import { ElysiaProtobufOptions, Schemas } from "../src/types/client";
import { RequestTags, ResponseTags } from "./proto/general";

const schemas = {
  "tags.request": RequestTags,
  "tags.response": ResponseTags,
} as const satisfies Schemas;
export const pluginOpts: ElysiaProtobufOptions<typeof schemas> = {
  schemas,
};

export const tags = ["hello", "world"];
