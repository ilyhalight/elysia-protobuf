import crypto from "node:crypto";

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
