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
