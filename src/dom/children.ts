import { Text } from "../bindings/text.js";
import { isReactive } from "../reactive/read.js";
import type { ElementChild } from "./types.js";

export function normalizeChildren(children: ElementChild[]): Node[] {
  const nodes: Node[] = [];

  for (const child of children) {
    if (child == null || child === false) continue;

    if (Array.isArray(child)) {
      nodes.push(...normalizeChildren([...child]));
    } else if (child instanceof DocumentFragment) {
      nodes.push(...child.childNodes);
    } else if (child instanceof Node) {
      nodes.push(child);
    } else if (isReactive(child)) {
      nodes.push(Text(child));
    } else {
      nodes.push(document.createTextNode(String(child)));
    }
  }

  return nodes;
}
