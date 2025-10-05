import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
  // @ts-expect-error assign webcrypto in node
  globalThis.crypto = webcrypto;
}
