type Subscriber = () => void;
type Cleanup = () => void;

export type Readable<T> = {
  get(): T;
  subscribe(subscriber: Subscriber): Cleanup;
};

export type Signal<T> = Readable<T> & {
  set(nextValue: T): void;
  update(fn: (value: T) => T): void;
};

type ReactiveSource = Readable<unknown>;

type Observer = {
  depend(source: ReactiveSource): void;
};

export type MaybeReactive<T> = T | Readable<T>;
export type Child = Node | Readable<unknown> | string | number | boolean | null | undefined | readonly Child[];
export type ElementChild = Child;
export type StyleProps = {
  [K in Lowercase<string> | `--${string}`]?: MaybeReactive<unknown>;
};
export type ElementProps = Record<string, unknown> & {
  style?: StyleProps;
};

type ElementArgs = [ElementProps, ...ElementChild[]] | ElementChild[];
type ElementFactory<TElement extends Element> = (...args: ElementArgs) => TElement;

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

let activeObserver: Observer | null = null;

const cleanupMap = new WeakMap<Node, Cleanup[]>();

export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Subscriber>();

  const api: Signal<T> = {
    get() {
      track(api);
      return value;
    },
    set(nextValue) {
      if (Object.is(value, nextValue)) return;
      value = nextValue;
      for (const subscriber of [...subscribers]) subscriber();
    },
    update(fn) {
      api.set(fn(value));
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    }
  };

  return api;
}

export function computed<T>(fn: () => T): Readable<T> {
  let value: T;
  let dirty = true;
  const subscribers = new Set<Subscriber>();
  const dependencies = new Map<ReactiveSource, Cleanup>();

  const api: Readable<T> = {
    get() {
      track(api);
      if (dirty) recompute();
      return value;
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
        if (subscribers.size === 0) clearDependencies();
      };
    }
  };

  function clearDependencies() {
    for (const unsubscribe of dependencies.values()) unsubscribe();
    dependencies.clear();
  }

  function recompute() {
    clearDependencies();

    const previousObserver = activeObserver;
    activeObserver = {
      depend(source) {
        if (dependencies.has(source)) return;
        dependencies.set(
          source,
          source.subscribe(() => {
            if (dirty) return;
            dirty = true;
            for (const subscriber of [...subscribers]) subscriber();
          })
        );
      }
    };

    try {
      value = fn();
      dirty = false;
    } finally {
      activeObserver = previousObserver;
    }
  }

  return api;
}

export function effect(fn: () => void): Cleanup {
  const dependencies = new Map<ReactiveSource, Cleanup>();
  let stopped = false;

  const observer: Observer = {
    depend(source) {
      if (dependencies.has(source)) return;
      dependencies.set(source, source.subscribe(run));
    }
  };

  function clearDependencies() {
    for (const unsubscribe of dependencies.values()) unsubscribe();
    dependencies.clear();
  }

  function run() {
    if (stopped) return;
    clearDependencies();

    const previousObserver = activeObserver;
    activeObserver = observer;

    try {
      fn();
    } finally {
      activeObserver = previousObserver;
    }
  }

  run();

  return () => {
    stopped = true;
    clearDependencies();
  };
}

export function Text(value: MaybeReactive<unknown>): Text {
  const node = document.createTextNode(String(read(value)));

  if (isReactive(value)) {
    const stop = effect(() => {
      node.data = String(value.get());
    });
    onCleanup(node, stop);
  }

  return node;
}

export function When(condition: MaybeReactive<unknown>, render: () => ElementChild): DocumentFragment {
  const start = document.createComment("when:start");
  const end = document.createComment("when:end");
  let mountedNodes: Node[] = [];

  const fragment = document.createDocumentFragment();
  fragment.append(start, end);

  const stop = effect(() => {
    const shouldMount = Boolean(read(condition));

    if (!shouldMount) {
      clearRegion();
      return;
    }

    if (mountedNodes.length > 0) return;

    mountedNodes = normalizeChildren([render()]);
    end.before(...mountedNodes);
  });

  onCleanup(start, () => {
    stop();
    clearRegion();
  });

  return fragment;

  function clearRegion() {
    for (const node of mountedNodes) unmount(node);
    mountedNodes = [];
  }
}

export function mount(parent: ParentNode, child: ElementChild): Node | Node[] {
  const nodes = normalizeChildren([child]);
  parent.append(...nodes);
  return nodes.length === 1 ? nodes[0] : nodes;
}

export function unmount(child: ElementChild): void {
  for (const node of normalizeChildren([child])) {
    cleanupTree(node);
    node.parentNode?.removeChild(node);
  }
}

export function replace(parent: Node, oldChild: Node, newChild: ElementChild): Node | Node[] {
  const nodes = normalizeChildren([newChild]);
  const firstNode = nodes[0] ?? document.createTextNode("");

  parent.insertBefore(firstNode, oldChild);
  for (const node of nodes.slice(1)) parent.insertBefore(node, oldChild);
  unmount(oldChild);

  return nodes.length === 1 ? firstNode : nodes;
}

export const dom = {
  mount,
  unmount,
  replace
};

export const html = createElementNamespace<HTMLElement>((tagName) => document.createElement(tagName)) as HtmlFactory;

export const svg = createElementNamespace<SVGElement>((tagName) =>
  document.createElementNS("http://www.w3.org/2000/svg", tagName)
) as SvgFactory;

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  ...args: ElementArgs
): HTMLElementTagNameMap[K];
export function createElement(tagName: string, ...args: ElementArgs): HTMLElement;
export function createElement(tagName: string, ...args: ElementArgs): HTMLElement {
  return createElementFrom(document.createElement(tagName), args);
}

export function createElementNS<K extends keyof SVGElementTagNameMap>(
  namespaceURI: "http://www.w3.org/2000/svg",
  tagName: K,
  ...args: ElementArgs
): SVGElementTagNameMap[K];
export function createElementNS(namespaceURI: string, tagName: string, ...args: ElementArgs): Element;
export function createElementNS(namespaceURI: string, tagName: string, ...args: ElementArgs): Element {
  return createElementFrom(document.createElementNS(namespaceURI, tagName), args);
}

function createElementFrom<TElement extends Element>(node: TElement, args: ElementArgs): TElement {
  const [props, children] = splitElementArgs(args);
  applyProps(node, props);
  node.append(...normalizeChildren(children));
  return node;
}

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

function splitElementArgs(args: ElementArgs): [ElementProps | null, ElementChild[]] {
  if (isPropsObject(args[0])) {
    return [args[0], args.slice(1) as ElementChild[]];
  }

  return [null, args as ElementChild[]];
}

function isPropsObject(value: unknown): value is ElementProps {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Node) &&
    !isReactive(value)
  );
}

function applyProps(node: Element, props: ElementProps | null): void {
  if (!props) return;

  for (const [name, value] of Object.entries(props)) {
    if (name === "style" && value && typeof value === "object" && !isReactive(value)) {
      applyStyle(node as HTMLElement | SVGElement, value as Record<string, unknown>);
    } else if (name.startsWith("on") && typeof value === "function") {
      bindEvent(node, name.slice(2).toLowerCase(), value as EventListener);
    } else {
      bindProp(node, name, value);
    }
  }
}

function applyStyle(node: HTMLElement | SVGElement, styles: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(styles)) {
    const assign = (nextValue: unknown) => {
      node.style.setProperty(name, nextValue == null ? "" : String(nextValue));
    };

    assign(read(value));
    bindReactive(node, value, (reactive) => assign(reactive.get()));
  }
}

function bindEvent(node: Element, eventName: string, handler: EventListener): void {
  node.addEventListener(eventName, handler);
  onCleanup(node, () => node.removeEventListener(eventName, handler));
}

function bindProp(node: Element, name: string, value: unknown): void {
  const assign = (nextValue: unknown) => {
    if (nextValue === false || nextValue == null) {
      removeDomValue(node, name);
      return;
    }

    if (name in node) {
      (node as unknown as Record<string, unknown>)[name] = nextValue;
    } else {
      node.setAttribute(name, String(nextValue));
    }
  };

  assign(read(value));
  bindReactive(node, value, (reactive) => assign(reactive.get()));
}

function bindReactive(node: Node, value: unknown, update: (value: Readable<unknown>) => void): void {
  if (!isReactive(value)) return;
  const stop = effect(() => update(value));
  onCleanup(node, stop);
}

function removeDomValue(node: Element, name: string): void {
  if (name in node && typeof (node as unknown as Record<string, unknown>)[name] === "boolean") {
    (node as unknown as Record<string, unknown>)[name] = false;
  } else if (name in node) {
    (node as unknown as Record<string, unknown>)[name] = "";
  }

  node.removeAttribute(name);
}

function normalizeChildren(children: ElementChild[]): Node[] {
  const nodes: Node[] = [];

  for (const child of children) {
    if (child == null || child === false) continue;

    if (Array.isArray(child)) {
      nodes.push(...normalizeChildren([...child]));
    } else if (child instanceof DocumentFragment) {
      nodes.push(...child.childNodes);
    } else if (child instanceof Node) {
      nodes.push(child);
    } else if (isReactive(child)) {
      nodes.push(Text(child));
    } else {
      nodes.push(document.createTextNode(String(child)));
    }
  }

  return nodes;
}

function cleanupTree(node: Node): void {
  const callbacks = cleanupMap.get(node);
  if (callbacks) {
    for (const callback of callbacks) callback();
    cleanupMap.delete(node);
  }

  for (const child of [...node.childNodes]) cleanupTree(child);
}

function onCleanup(node: Node, callback: Cleanup): void {
  const callbacks = cleanupMap.get(node) ?? [];
  callbacks.push(callback);
  cleanupMap.set(node, callbacks);
}

function read<T>(value: MaybeReactive<T>): T {
  return isReactive(value) ? value.get() : value;
}

function isReactive(value: unknown): value is Readable<unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    "get" in value &&
    typeof value.get === "function" &&
    "subscribe" in value &&
    typeof value.subscribe === "function"
  );
}

function track(source: ReactiveSource): void {
  activeObserver?.depend(source);
}
