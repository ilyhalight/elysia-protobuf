import { RequestTags, ResponseTags } from "./proto/general";
import { TProtobuf } from "../src/type-system";

export const tags = ["hello", "world"];
export const encodedTags = RequestTags.encode({
  tags,
}).finish();
export const RequestTagsSchema = TProtobuf(RequestTags);
export const ResponseTagsSchema = TProtobuf(ResponseTags);
