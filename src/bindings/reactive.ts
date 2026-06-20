import { onCleanup } from "../dom/cleanup.js";
import { effect } from "../reactive/effect.js";
import { isReactive } from "../reactive/read.js";
import type { Readable } from "../reactive/types.js";

export function bindReactive(node: Node, value: unknown, update: (value: Readable<unknown>) => void): void {
  if (!isReactive(value)) return;
  const stop = effect(() => update(value));
  onCleanup(node, stop);
}
