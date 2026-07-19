export class ProtoRequestError extends Error {
  status = 400;
}

export class ProtoValidationError extends Error {
  status = 422;
}
