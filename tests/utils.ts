import { ResponseTags } from "./proto/general";

export const post = (
  path: string,
  body?: Uint8Array,
  headers: Record<string, string> = {},
) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-protobuf",
      ...headers,
    },
    body,
  });

export const decodeTags = async (res: Response) => {
  const response = await res.arrayBuffer();
  return ResponseTags.decode(new Uint8Array(response));
};
