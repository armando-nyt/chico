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
import { Button, Div, H1, Text, computed, signal, mount } from "./src/index.js";

const count = signal(0);
const label = computed(() => `Count: ${count.get()}`);

mount(
  document.body,
  Div(
    { className: "card" },
    H1(null, "Counter"),
    Div(null, Text(label)),
    Button({ onclick: () => count.update((n) => n + 1) }, "Increment")
  )
);
```

## API

- `signal(initialValue)` creates mutable reactive state with `get`, `set`, `update`, and `subscribe`.
- `computed(fn)` creates derived reactive state.
- `effect(fn)` runs a reactive function and returns a stop function.
- `Text(value)` creates a text node. Reactive values update only that text node.
- `When(condition, render)` creates a comment-anchored conditional region. False removes DOM and cleans bindings.
- `mount(parent, child)` appends DOM.
- `unmount(child)` removes DOM and cleans bindings below it.
- `replace(parent, oldChild, newChild)` replaces DOM with cleanup.
- `el(tagName, props, ...children)` creates an element.
- `tag(tagName)` creates a DOM helper.
- Built-in helpers include `Div`, `Button`, `H1`, `P`, `Span`, `Input`, and others.

## Run

Open `demo/index.html` in a browser.

If local module loading is restricted by the browser, serve the folder with any static file server. Python works when available:

```sh
cd ~/dev/ui-library
python3 -m http.server 5173
```

Then open `http://localhost:5173/demo/`.

With Node available:

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
