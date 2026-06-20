import { read } from "../reactive/read.js";
import { bindReactive } from "./reactive.js";

export function bindProp(node: Element, name: string, value: unknown): void {
  const assign = (nextValue: unknown) => {
    if (nextValue === false || nextValue == null) {
      removeDomValue(node, name);
      return;
    }

    if (node instanceof SVGElement) {
      node.setAttribute(name, String(nextValue));
    } else if (name in node) {
      (node as unknown as Record<string, unknown>)[name] = nextValue;
    } else {
      node.setAttribute(name, String(nextValue));
    }
  };

  assign(read(value));
  bindReactive(node, value, (reactive) => assign(reactive.get()));
}

function removeDomValue(node: Element, name: string): void {
  if (node instanceof SVGElement) {
    node.removeAttribute(name);
    return;
  }

  if (name in node && typeof (node as unknown as Record<string, unknown>)[name] === "boolean") {
    (node as unknown as Record<string, unknown>)[name] = false;
  } else if (name in node) {
    (node as unknown as Record<string, unknown>)[name] = "";
  }

  node.removeAttribute(name);
}
