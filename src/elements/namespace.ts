import { createElementFrom } from "./createElement.js";
import type { ElementFactory, HtmlFactory, SvgFactory } from "./types.js";

export const html = createElementNamespace<HTMLElement>((tagName) => document.createElement(tagName)) as HtmlFactory;

export const svg = createElementNamespace<SVGElement>((tagName) =>
  document.createElementNS("http://www.w3.org/2000/svg", tagName)
) as SvgFactory;

function createElementNamespace<TElement extends Element>(
  createNode: (tagName: string) => TElement
): Record<string, ElementFactory<TElement>> {
  const factories = new Map<string, ElementFactory<TElement>>();

  return new Proxy(Object.create(null) as Record<string, ElementFactory<TElement>>, {
    get(_, tagName) {
      if (typeof tagName !== "string") return undefined;

      if (!factories.has(tagName)) {
        factories.set(tagName, (...args) => createElementFrom(createNode(tagName), args));
      }

      return factories.get(tagName);
    }
  });
}
