import { createHash } from "node:crypto";

export function hashString(input: string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex").substring(0, 32);
}
