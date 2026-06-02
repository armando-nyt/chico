# Tiny DOM-First UI

Initial prototype of a tiny DOM-first reactive UI library.

The library is plain browser JavaScript:

- no JSX
- no transpilation
- no virtual DOM
- no build step
- no component lifecycle model

## Example

```js
import { Text, computed, dom, html, signal } from "./src/index.js";

const count = signal(0);
const label = computed(() => `Count: ${count.get()}`);

dom.mount(
  document.body,
  html.div(
    { className: "card" },
    html.h1("Counter"),
    html.div(Text(label)),
    html.button({ onclick: () => count.update((n) => n + 1) }, "Increment")
  )
);
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

```js
html.button({ type: "button" }, "Save")
html.p("No props needed")
```

## Run

Start the Vite dev server:

```sh
cd ~/dev/ui-library
npm run dev
```

Then open `http://localhost:5173/demo/`.

If you use `mise`:

```sh
cd ~/dev/ui-library
mise exec -- npm run dev
```

## Tests

Open `test/index.html` in a browser. The tests run in the page and report pass/fail results.

With Node available:

```sh
cd ~/dev/ui-library
mise exec -- npm test
```
