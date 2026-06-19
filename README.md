# chico

A tiny DOM-first reactive UI library.

The library is authored in TypeScript and emits plain browser JavaScript:

- no JSX
- no virtual DOM
- no runtime renderer
- no component lifecycle model
- no compile-time UI magic

## Example

```ts
import { Text, computed, dom, html, signal } from "./src/index.js";

const count = signal(0);
const countLabel = computed(() => `Count: ${count.get()}`);

dom.mount(
  document.body,
  html.div(
    { className: "card" },
    html.h1("Counter"),
    html.div(Text(countLabel)),
    html.button({ onclick: () => count.update((n) => n + 1) }, "Increment")
  )
);
```

## Naming convention

These names are only convention. chico does not inspect variable names or give them runtime meaning.

- Signals use simple domain names, for example `count`, `room`, or `panelOpen`.
- Computed values use purpose-first names, for example `countLabel`, `panelTitle`, or `panelStatus`.
- Use `From...` only when the dependency is simple and useful to call out, for example `labelFromCount`.
- Element-producing view functions use PascalCase, for example `CounterPanel()` or `PanelRegion()`.

That keeps element creation readable without adding magic:

```ts
html.input({ value: room })
html.p(Text(panelTitle))
When(panelOpen, () => PanelRegion())
```

## API

- `signal(initialValue)` creates mutable reactive state with `get`, `set`, `update`, and `subscribe`.
- `computed(fn)` creates derived reactive state.
- `effect(fn)` runs a reactive function and returns a stop function.
- `Text(value)` creates a text node. Reactive values update only that text node.
- `When(condition, render)` creates a comment-anchored conditional region. False removes DOM and cleans bindings.
- `html.*` creates HTML elements with real DOM nodes, for example `html.div(...)`.
- `svg.*` creates SVG elements with real DOM nodes, for example `svg.circle(...)`.
- `dom.mount(parent, child)` appends DOM.
- `dom.unmount(child)` removes DOM and cleans bindings below it.
- `dom.replace(parent, oldChild, newChild)` replaces DOM with cleanup.
- `createElement(tagName, ...args)` creates an HTML element directly.
- `createElementNS(namespaceURI, tagName, ...args)` creates a namespaced element directly.

Element factories accept either props followed by children or children directly:

```ts
html.button({ type: "button" }, "Save")
html.p("No props needed")
```

## How reactivity works

chico uses fine-grained subscriptions instead of re-rendering a component tree.

Each `signal` stores one value and a set of subscribers. Calling `get()` returns the current value. Calling `set()` or `update()` changes the value and notifies subscribers, unless the next value is the same by `Object.is`.

`computed(fn)` creates a lazy readable value. When something calls `get()`, chico runs `fn` and records every reactive value read during that run. Those dependencies subscribe the computed value to future changes. When a dependency changes, the computed value is marked dirty and its subscribers are notified. The actual derived value is recalculated the next time it is read.

`effect(fn)` is the bridge between reactive values and side effects. While an effect runs, reads from signals and computed values are tracked. When any dependency changes, the effect clears its old subscriptions, runs again, and records the dependencies from the latest run.

DOM bindings are built on top of effects:

- `Text(value)` creates one text node and updates only that node when `value` changes.
- Reactive props and styles update the existing element or style declaration.
- `When(condition, render)` uses comment anchors to insert and remove real DOM nodes.
- `dom.unmount()` walks the removed subtree and runs cleanup callbacks, so event listeners and reactive subscriptions are stopped with the nodes that own them.

## Lazy tag factories

`html.*` and `svg.*` are backed by a `Proxy`. Instead of shipping one function definition for every valid tag, chico creates each factory the first time it is accessed and caches it:

```ts
html.div("Hello")
html.button({ type: "button" }, "Save")
svg.circle({ cx: 10, cy: 10, r: 4 })
```

That means the runtime supports all valid HTML, SVG, and custom element tag names without a large bundle full of predeclared factories. TypeScript still provides known-tag types through `HTMLElementTagNameMap` and `SVGElementTagNameMap`, while arbitrary string tags remain available for custom elements and newer platform tags.

## Run

Start the Vite dev server:

```sh
cd ~/dev/chico
npm run dev
```

Then open `http://localhost:5173/demo/`.

If you use `mise`:

```sh
cd ~/dev/chico
mise exec -- npm run dev
```

## Tests

Open `test/index.html` in a browser. The tests run in the page and report pass/fail results.

With Node available:

```sh
cd ~/dev/chico
mise exec -- npm test
```

## Build

```sh
npm run typecheck
npm run build
```
