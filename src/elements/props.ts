import { bindProp } from "../bindings/attr.js";
import { applyStyle } from "../bindings/style.js";
import { onCleanup } from "../dom/cleanup.js";
import { isReactive } from "../reactive/read.js";
import type { ElementProps } from "./types.js";

export function splitElementArgs<TArgs extends unknown[]>(args: TArgs): [ElementProps | null, unknown[]] {
  if (isPropsObject(args[0])) {
    return [args[0], args.slice(1)];
  }

  return [null, args];
}

export function applyProps(node: Element, props: ElementProps | null): void {
  if (!props) return;

  for (const [name, value] of Object.entries(props)) {
    if (name === "style" && value && typeof value === "object" && !isReactive(value)) {
      applyStyle(node as HTMLElement | SVGElement, value as Record<string, unknown>);
    } else if (name.startsWith("on") && typeof value === "function") {
      bindEvent(node, name.slice(2).toLowerCase(), value as EventListener);
    } else {
      bindProp(node, name, value);
    }
  }
}

function isPropsObject(value: unknown): value is ElementProps {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Node) &&
    !isReactive(value)
  );
}

function bindEvent(node: Element, eventName: string, handler: EventListener): void {
  node.addEventListener(eventName, handler);
  onCleanup(node, () => node.removeEventListener(eventName, handler));
}
