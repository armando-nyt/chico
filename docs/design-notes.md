# UI Library Design Notes

## Core Philosophy

The goal of this library is not to replace the DOM or HTML. It exists to make working with the DOM less painful while preserving native browser concepts and APIs.

Principles:

- Prefer honest abstractions.
- Keep the DOM front and center.
- Avoid virtual DOMs.
- Avoid renderers.
- Avoid compile-time magic.
- Avoid creating a new mental model for UI development.
- Make it easy to fall back to native DOM APIs at any time.
- Keep the API surface area small and focused.

A developer should be able to understand the entire library in a short amount of time.

## Element Creation

Instead of exporting individual functions for every HTML element:

```js
Div(...)
Button(...)
Input(...)
Span(...)
```

Use a namespace-based approach:

```js
html.div(...)
html.button(...)
html.input(...)
html.span(...)
```

This groups related functionality under a single concept and avoids polluting the top-level API.

## Dynamic Element Factories

Rather than manually defining every HTML element factory:

```js
const Div = tag("div")
const Button = tag("button")
const Input = tag("input")
```

Generate them dynamically using a `Proxy`:

```js
export const html = new Proxy({}, {
  get(_, tagName) {
    return (...args) => createElement(tagName, ...args);
  },
});
```

Usage:

```js
html.div(
  { class: "card" },
  html.h1("Hello"),
  html.button("Save")
)
```

## Naming Reactive Values and Views

Variable names are only convention. chico does not inspect names or give them runtime meaning.
Examples should make the role of each value easy to scan without implying magic:

```ts
const count = signal(0);
const room = signal("Kitchen");
const panelOpen = signal(true);

const countLabel = computed(() => `Count: ${count.get()}`);
const panelTitle = computed(() => `${room.get()} panel`);
const panelStatus = computed(() => (panelOpen.get() ? "mounted" : "unmounted"));

function PanelRegion(): HTMLElement {
  return html.section(
    html.h2(Text(panelTitle)),
    html.p("Status: ", Text(panelStatus))
  );
}
```

Recommended convention:

- Signals use simple domain names: `count`, `room`, `panelOpen`.
- Computed values use purpose-first names: `countLabel`, `panelTitle`, `panelStatus`.
- `From...` names are optional for simple derivations: `labelFromCount`, `titleFromRoom`.
- Element-producing view functions use PascalCase: `CounterPanel()`, `PanelRegion()`.

This keeps call sites readable without adding syntax, sigils, or mandatory naming rules.

Benefits:

- No manual registration of elements.
- No large export surface.
- Automatically supports all valid HTML tags.
- Easily extensible to SVG and custom elements.
- Tiny implementation.

With proper TypeScript typing later:

```ts
type HtmlFactory = {
  [K in keyof HTMLElementTagNameMap]: ElementFactory<K>
}
```

Typos become compile-time errors:

```ts
html.div()     // valid
html.button()  // valid
html.dvi()     // error
```

## Namespaces Over Flat APIs

The library should prefer namespaces rather than exporting dozens of unrelated functions.

Example structure:

```js
html.div(...)
html.button(...)

svg.circle(...)
svg.path(...)

signal(...)
computed(...)

dom.mount(...)
dom.remove(...)
```

This creates a small number of concepts instead of a large flat API.

Avoid:

```js
Div(...)
Button(...)
Circle(...)
Path(...)
mount(...)
remove(...)
signal(...)
computed(...)
```

## Why `html` Is a Good Namespace

Export:

```js
export { html }
```

Usage:

```js
import { html } from "lib"

html.div(...)
```

Users can still rename it if desired:

```js
import { html as h } from "lib"

h.div(...)
```

or:

```js
import { html as el } from "lib"

el.div(...)
```

The library should provide a clear default without forcing a specific naming convention.

## Mental Model

The intended mental model is:

```js
html.div(...)
```

means:

> Create a div element.

Nothing more.

No hidden renderer.
No component lifecycle.
No virtual DOM.
No reconciliation process.
No illusion that HTML is being written directly in JavaScript.

The API should remain explicit about what is happening.

## Comparison to JSX

JSX often changes the mental model of UI development.

Example:

```jsx
<div />
```

Looks like HTML but is actually creating a description of UI that will later be interpreted by a rendering system.

By contrast:

```js
html.div(...)
```

Makes it clear that an element is being created.

The abstraction remains honest and closely aligned with the browser's native APIs.

## Long-Term Direction

The library is shaping up as a collection of focused modules rather than a framework.

Potential structure:

```js
html.*      // HTML element creation
svg.*       // SVG element creation
signal()    // reactive state
computed()  // derived state
dom.*       // mounting and DOM helpers
```

This keeps the conceptual footprint small while still providing meaningful ergonomics over the raw DOM.

The goal is not to compete with large frameworks.

The goal is to provide a tiny, understandable layer that makes native DOM development pleasant while preserving native browser concepts.
