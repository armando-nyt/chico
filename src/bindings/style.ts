import { read } from "../reactive/read.js";
import { bindReactive } from "./reactive.js";

export function applyStyle(node: HTMLElement | SVGElement, styles: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(styles)) {
    const assign = (nextValue: unknown) => {
      node.style.setProperty(name, nextValue == null ? "" : String(nextValue));
    };

    assign(read(value));
    bindReactive(node, value, (reactive) => assign(reactive.get()));
  }
}
