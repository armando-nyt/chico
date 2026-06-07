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

The implementation should stay lazy. The proxy creates a factory only when a property is first accessed, then keeps that function in a small cache:

```ts
const factories = new Map()

const html = new Proxy({}, {
  get(_, tagName) {
    if (!factories.has(tagName)) {
      factories.set(tagName, (...args) => createElement(tagName, ...args))
    }

    return factories.get(tagName)
  }
})
```

That keeps the bundle from carrying hundreds of tag factory definitions. It also means newly standardized tags and custom elements work without a library release:

```ts
html.dialog(...)
html.search(...)
html["my-widget"](...)
```

Known HTML and SVG names can still be strongly typed, while the runtime stays open to every valid tag name the browser accepts.

## Reactive Mechanisms

Reactivity is explicit and fine-grained. A reactive value is any object with this small shape:

```ts
{
  get(): T
  subscribe(subscriber: () => void): () => void
}
```

Signals, computed values, text bindings, prop bindings, style bindings, and conditional regions all build on that contract.

### Signals

A signal owns one current value and a set of subscriber callbacks:

```ts
const count = signal(0)

count.get()
count.set(1)
count.update((n) => n + 1)
count.subscribe(() => {
  console.log(count.get())
})
```

Calling `get()` returns the current value and participates in dependency tracking if a computed value or effect is currently running. Calling `set()` compares the next value with the current value using `Object.is`; if the value changed, all subscribers are called.

### Dependency Tracking

The library keeps one internal `activeObserver`.

When a computed value or effect runs, chico temporarily sets `activeObserver` to that running observer. Any signal or computed value read during that time calls `track(source)`, which tells the active observer to depend on that source. When the function finishes, the previous observer is restored.

This means dependencies are discovered from the code that actually ran:

```ts
const label = computed(() => {
  if (open.get()) return title.get()
  return "Closed"
})
```

If `open` is false, `title` is not a dependency for that run. When the function runs again later, dependencies are cleared and collected again.

### Computed Values

A computed value is lazy derived state. It keeps:

- the cached value
- a dirty flag
- subscribers
- unsubscribe callbacks for its current dependencies

The first `get()` runs the derivation and subscribes to every reactive value read during that run. When one of those dependencies changes, the computed value is marked dirty and its own subscribers are notified. The derivation runs again only when the value is read.

When a computed value has no subscribers left, it clears its dependency subscriptions and marks itself dirty. That keeps unused derived values from staying connected to the graph.

### Effects

An effect is an eager reactive function:

```ts
const stop = effect(() => {
  node.data = String(count.get())
})
```

It runs immediately, records the reactive values it reads, and subscribes to them. When any dependency changes, the effect clears its old subscriptions and runs again. The returned stop function marks the effect as stopped and removes its subscriptions.

Effects are how chico wires reactive values to DOM updates. They are used internally for text nodes, props, styles, and `When`.

### DOM Cleanup

Reactive DOM bindings attach their stop callbacks to the node they update. Event listeners are stored the same way. When `dom.unmount()` removes a node, chico walks the subtree and runs every cleanup callback it finds before removing the nodes from the document.

That gives each DOM binding a clear owner:

- a text binding belongs to its text node
- a prop or style binding belongs to its element
- an event listener belongs to its element
- a conditional region belongs to its comment anchor

Removing DOM removes the subscriptions and listeners tied to that DOM.

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
