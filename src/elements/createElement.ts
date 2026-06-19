import { normalizeChildren } from "../dom/children.js";
import type { ElementChild } from "../dom/types.js";
import { applyProps, splitElementArgs } from "./props.js";
import type { ElementArgs } from "./types.js";

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  ...args: ElementArgs
): HTMLElementTagNameMap[K];
export function createElement(tagName: string, ...args: ElementArgs): HTMLElement;
export function createElement(tagName: string, ...args: ElementArgs): HTMLElement {
  return createElementFrom(document.createElement(tagName), args);
}

export function createElementNS<K extends keyof SVGElementTagNameMap>(
  namespaceURI: "http://www.w3.org/2000/svg",
  tagName: K,
  ...args: ElementArgs
): SVGElementTagNameMap[K];
export function createElementNS(namespaceURI: string, tagName: string, ...args: ElementArgs): Element;
export function createElementNS(namespaceURI: string, tagName: string, ...args: ElementArgs): Element {
  return createElementFrom(document.createElementNS(namespaceURI, tagName), args);
}

export function createElementFrom<TElement extends Element>(node: TElement, args: ElementArgs): TElement {
  const [props, children] = splitElementArgs(args);
  applyProps(node, props);
  node.append(...normalizeChildren(children as ElementChild[]));
  return node;
}
