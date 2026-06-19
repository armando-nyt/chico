import type { Readable } from "../reactive/types.js";

export type Child = Node | Readable<unknown> | string | number | boolean | null | undefined | readonly Child[];
export type ElementChild = Child;
