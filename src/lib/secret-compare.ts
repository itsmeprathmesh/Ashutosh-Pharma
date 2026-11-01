import { createHash, timingSafeEqual } from "node:crypto";

export function timingSafeStringEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest) && Buffer.byteLength(left) === Buffer.byteLength(right);
}
