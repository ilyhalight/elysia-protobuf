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
  /**
   * Show parse errors instead of Bad Request 400
   *
   * @default true
   */
  showParseErrors?: boolean;
};

export type Schemas = Record<string, MessageFns<any>>;

export type ElysiaProtobufOptions = {
  /**
   * Signature options
   *
   * @default undefined
   */
  signature?: SignatureOptions;
};
