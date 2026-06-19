import { onCleanup } from "../dom/cleanup.js";
import { effect } from "../reactive/effect.js";
import { isReactive, read } from "../reactive/read.js";
import type { MaybeReactive } from "../reactive/types.js";

export function Text(value: MaybeReactive<unknown>): Text {
  const node = document.createTextNode(String(read(value)));

  if (isReactive(value)) {
    const stop = effect(() => {
      node.data = String(value.get());
    });
    onCleanup(node, stop);
  }

  return node;
}
