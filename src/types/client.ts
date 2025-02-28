import type { MessageFns } from "./proto";

export type SignatureOptions = {
  /**
   * Enable body validation with header signature
   *
   * @default false
   */
  enabled?: boolean;
  /**
   * Header name for body request signature
   *
   * @default "x-signature"
   */
  headerName?: string;
  /**
   * Signature secret
   *
   * @default "replaceme"
   */
  secret?: string;
};

export type Schemas = Record<string, MessageFns<any>>;
export type ElysiaProtobufOptions<T extends Schemas> = {
  /**
   * Signature options
   *
   * @default undefined
   */
  signature?: SignatureOptions;
  /**
   * Like Elysia.model, but for protobuf schemas instead of typebox
   *
   * @default {}
   */
  schemas?: T;
};
