# Reactivity

chico uses fine-grained subscriptions. Reactive reads are ordinary function
calls, and dependencies are discovered from the code that actually runs.

The core reactive shape is:

```ts
type Readable<T> = {
  get(): T;
  subscribe(subscriber: () => void): () => void;
};
```

Signals and computed values both satisfy this shape.

## Signals

A signal owns one current value and one subscriber set.

```ts
const count = signal(0);

count.get();
count.set(1);
count.update((n) => n + 1);
```

Calling `get()` returns the current value. Calling `set()` or `update()` changes
the value and notifies subscribers when the value is different by `Object.is`.

Signals do not know ahead of time which computed values or effects depend on
them. That connection is made when a signal is read while dependency tracking is
active.

## The Active Observer

The dependency tracker keeps one module-scoped value:

```ts
let activeObserver: Observer | null = null;
```

Most of the time, `activeObserver` is `null`. It is only assigned while a
computed value or effect is running.

```ts
count.get();
// activeObserver is null, so this is just a read.

effect(() => {
  count.get();
  // activeObserver is this effect's observer during this function call.
});

// activeObserver is restored to null after the effect finishes.
```

This works because dependency tracking is implicit. User code does not pass an
observer into `count.get()`:

```ts
const label = computed(() => `Count: ${count.get()}`);
```

Instead, chico temporarily installs the currently running observer before it
runs the computed function. When `count.get()` calls `track(count)`, `track()`
can ask the active observer to depend on `count`.

```ts
function track(source: ReactiveSource): void {
  activeObserver?.depend(source);
}
```

`activeObserver` is not the dependency graph. It is only the temporary collector
for the currently executing reactive function.

The long-lived relationships live elsewhere:

- each signal owns its subscriber set
- each computed value owns a dependency map and a subscriber set
- each effect owns a dependency map

## Why One Reassigned Value?

At a given instant, synchronous JavaScript has one current call stack. During
dependency collection, chico only needs to answer one question:

Which observer is collecting dependencies right now?

That makes a single current observer enough. `withObserver()` saves the previous
observer, installs the new one, runs the function, and restores the previous
observer in a `finally` block.

```ts
export function withObserver<T>(observer: Observer, fn: () => T): T {
  const previousObserver = activeObserver;
  activeObserver = observer;

  try {
    return fn();
  } finally {
    activeObserver = previousObserver;
  }
}
```

That save-and-restore behavior acts like a tiny stack:

```text
null
effect observer
computed observer
effect observer
null
```

Nested reactive reads are why the previous observer must be restored:

```ts
effect(() => {
  count.get();

  computed(() => {
    title.get();
  }).get();

  status.get();
});
```

While the outer effect runs, reads belong to the effect. While the inner computed
recomputes, reads belong to the computed. After the computed finishes, reads
belong to the effect again.

A map is useful for storing long-lived dependency relationships. chico already
uses maps and sets for that. The active observer is different: it is short-lived
execution context, not stored dependency data.

## Computed Values

A computed value is lazy derived state.

```ts
const countLabel = computed(() => `Count: ${count.get()}`);
```

The computed function runs when the value is read and dirty. While it runs,
chico collects every reactive value that was read. Those values become the
computed value's dependencies.

When a dependency changes, the computed value is marked dirty and its subscribers
are notified. The computed function does not rerun until the next `get()`.

Each run clears the old dependencies and collects fresh ones. That makes
branching dependencies work naturally:

```ts
const label = computed(() => {
  if (open.get()) return title.get();
  return "Closed";
});
```

If `open` is false, `title` is not a dependency for that run.

## Effects

An effect is eager reactive side-effect code.

```ts
const stop = effect(() => {
  node.data = String(count.get());
});
```

It runs immediately, records the reactive values it reads, and subscribes to
them. When any dependency changes, the effect clears its old subscriptions and
runs again.

Effects are the bridge from reactive values to DOM updates. Text bindings,
attribute bindings, style bindings, and conditional regions all use effects
internally.

The returned stop function disconnects the effect from its dependencies.
