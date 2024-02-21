import { createHash } from "node:crypto";
import { z } from "zod";

export const ErrorResponse = z.object({
  code: z.string(),
  message: z.string(),
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ErrorResponse = z.infer<typeof ErrorResponse>;

export function isErrorResponse(input: unknown): input is ErrorResponse {
  return ErrorResponse.safeParse(input).success;
}

export function hashString(input: string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex").substring(0, 32);
}
