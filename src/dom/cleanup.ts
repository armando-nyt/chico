import type { Cleanup } from "../reactive/types.js";

const cleanupMap = new WeakMap<Node, Cleanup[]>();

export function cleanupTree(node: Node): void {
  const callbacks = cleanupMap.get(node);
  if (callbacks) {
    for (const callback of callbacks) callback();
    cleanupMap.delete(node);
  }

  for (const child of [...node.childNodes]) cleanupTree(child);
}

export function onCleanup(node: Node, callback: Cleanup): void {
  const callbacks = cleanupMap.get(node) ?? [];
  callbacks.push(callback);
  cleanupMap.set(node, callbacks);
}
