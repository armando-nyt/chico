import type { MaybeReactive } from "../reactive/types.js";
import type { ElementChild } from "../dom/types.js";

export type StyleProps = {
  [K in Lowercase<string> | `--${string}`]?: MaybeReactive<unknown>;
};

export type ElementProps = Record<string, unknown> & {
  style?: StyleProps;
};

export type ElementArgs = [ElementProps, ...ElementChild[]] | ElementChild[];
export type ElementFactory<TElement extends Element> = (...args: ElementArgs) => TElement;

export type HtmlFactory = {
  [K in keyof HTMLElementTagNameMap]: ElementFactory<HTMLElementTagNameMap[K]>;
} & {
  [tagName: string]: ElementFactory<HTMLElement>;
};

export type SvgFactory = {
  [K in keyof SVGElementTagNameMap]: ElementFactory<SVGElementTagNameMap[K]>;
} & {
  [tagName: string]: ElementFactory<SVGElement>;
};
