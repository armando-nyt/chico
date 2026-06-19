import { cleanupTree } from "./cleanup.js";
import { normalizeChildren } from "./children.js";
import type { ElementChild } from "./types.js";

export function mount(parent: ParentNode, child: ElementChild): Node | Node[] {
  const nodes = normalizeChildren([child]);
  parent.append(...nodes);
  return nodes.length === 1 ? nodes[0] : nodes;
}

export function unmount(child: ElementChild): void {
  for (const node of normalizeChildren([child])) {
    cleanupTree(node);
    node.parentNode?.removeChild(node);
  }
}

export function replace(parent: Node, oldChild: Node, newChild: ElementChild): Node | Node[] {
  const nodes = normalizeChildren([newChild]);
  const firstNode = nodes[0] ?? document.createTextNode("");

  parent.insertBefore(firstNode, oldChild);
  for (const node of nodes.slice(1)) parent.insertBefore(node, oldChild);
  unmount(oldChild);

  return nodes.length === 1 ? firstNode : nodes;
}

export const dom = {
  mount,
  unmount,
  replace
};
