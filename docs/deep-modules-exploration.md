# Deep modules exploration

This branch starts turning chico from a single-file prototype into a small library
organized around deep modules: modules with narrow public surfaces and substantial
internal responsibility.

The whole public API still flows through `src/index.ts`. The package also has
module facades for focused imports:

- `chico/reactive`
- `chico/dom`
- `chico/elements`
- `chico/bindings`

The internal implementation now groups code by behavior:

- `reactive/` tracks dependencies and propagates state changes.
- `dom/` owns node normalization, mounting, replacement, unmounting, and cleanup.
- `elements/` owns element factories, namespaces, props, and events.
- `bindings/` owns synchronization between reactive values and DOM state.

That follows the note in:

`/Users/armando/Documents/armando/Chico/Reactive Bindings as Deep Modules.md`

## Current module responsibilities

`bindings/text.ts`

Keeps one text node synchronized with a reactive value.

`bindings/when.ts`

Keeps a comment-anchored DOM region synchronized with a condition.

`bindings/attr.ts`

Keeps element attributes and DOM properties synchronized with values.

`bindings/style.ts`

Keeps style declarations synchronized with values.

## Why keep `src/index.ts` shallow?

Consumers should not need to know every internal file. The root export remains the
stable facade while package subpaths expose only the coarse, behavior-oriented
module boundaries.

## Next questions

- Should `bindings/reactive.ts` become a public low-level helper, or remain an
  implementation detail shared by attribute and style bindings?
- Should event listeners become a binding module, or stay under `elements/props.ts`
  because they are part of element creation rather than reactive synchronization?
- Should `chico/bindings` export only view-level bindings like `Text` and `When`,
  or should lower-level binding behaviors become public as extension points?
