import { RequestMessage, ResponseMessage } from "./proto/message";
import { sign } from "../../src/index";

async function main() {
  const data = RequestMessage.encode({
    title: "hello world!",
    tags: ["test", "world", "just a fish"],
    updatedAt: Math.floor(Date.now() / 1000),
  }).finish();
  const signature = await sign(data, "changeme");

  const res = await fetch("http://127.0.0.1:3000/post", {
    headers: {
      "Content-Type": "application/x-protobuf",
      "x-signature": signature,
    },
    method: "POST",
    body: data,
  });

  console.log(`status: ${res.status}`);
  if (!res.ok) {
    const out = await res.text();
    console.log(out);
    return;
  }

  const response = await res.arrayBuffer();
  const out = ResponseMessage.decode(new Uint8Array(response));

  console.log(out);
}

await main();
