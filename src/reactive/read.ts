import type { MaybeReactive, Readable } from "./types.js";

export function read<T>(value: MaybeReactive<T>): T {
  return isReactive(value) ? value.get() : value;
}

export function isReactive(value: unknown): value is Readable<unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    "get" in value &&
    typeof value.get === "function" &&
    "subscribe" in value &&
    typeof value.subscribe === "function"
  );
}
