let activeObserver = null;

const cleanupMap = new WeakMap();

export function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const api = {
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

export function computed(fn) {
  let value;
  let dirty = true;
  const subscribers = new Set();
  const dependencies = new Map();

  const api = {
    get() {
      track(api);
      if (dirty) recompute();
      return value;
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    }
  };

  function recompute() {
    for (const unsubscribe of dependencies.values()) unsubscribe();
    dependencies.clear();

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

export function effect(fn) {
  const dependencies = new Map();
  let stopped = false;

  const observer = {
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

export function Text(value) {
  const node = document.createTextNode(String(read(value)));

  if (isReactive(value)) {
    const stop = effect(() => {
      node.data = String(value.get());
    });
    onCleanup(node, stop);
  }

  return node;
}

export function When(condition, render) {
  const start = document.createComment("when:start");
  const end = document.createComment("when:end");
  let mountedNodes = [];

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

export function mount(parent, child) {
  const nodes = normalizeChildren([child]);
  parent.append(...nodes);
  return nodes.length === 1 ? nodes[0] : nodes;
}

export function unmount(child) {
  for (const node of normalizeChildren([child])) {
    cleanupTree(node);
    node.remove();
  }
}

export function replace(parent, oldChild, newChild) {
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

export const html = createElementNamespace((tagName) => document.createElement(tagName));

export const svg = createElementNamespace((tagName) =>
  document.createElementNS("http://www.w3.org/2000/svg", tagName)
);

export function createElement(tagName, ...args) {
  return createElementFrom(document.createElement(tagName), args);
}

export function createElementNS(namespaceURI, tagName, ...args) {
  return createElementFrom(document.createElementNS(namespaceURI, tagName), args);
}

function createElementFrom(node, args) {
  const [props, children] = splitElementArgs(args);
  applyProps(node, props);
  node.append(...normalizeChildren(children));
  return node;
}

function createElementNamespace(createNode) {
  const factories = new Map();

  return new Proxy(Object.create(null), {
    get(_, tagName) {
      if (typeof tagName !== "string") return undefined;

      if (!factories.has(tagName)) {
        factories.set(tagName, (...args) => createElementFrom(createNode(tagName), args));
      }

      return factories.get(tagName);
    }
  });
}

function splitElementArgs(args) {
  if (isPropsObject(args[0])) {
    return [args[0], args.slice(1)];
  }

  return [null, args];
}

function isPropsObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Node) &&
    !isReactive(value)
  );
}

function applyProps(node, props) {
  if (!props) return;

  for (const [name, value] of Object.entries(props)) {
    if (name === "style" && value && typeof value === "object") {
      applyStyle(node, value);
    } else if (name.startsWith("on") && typeof value === "function") {
      bindEvent(node, name.slice(2).toLowerCase(), value);
    } else {
      bindProp(node, name, value);
    }
  }
}

function applyStyle(node, styles) {
  for (const [name, value] of Object.entries(styles)) {
    const assign = (nextValue) => {
      node.style[name] = nextValue == null ? "" : String(nextValue);
    };

    assign(read(value));
    bindReactive(node, value, () => assign(value.get()));
  }
}

function bindEvent(node, eventName, handler) {
  node.addEventListener(eventName, handler);
  onCleanup(node, () => node.removeEventListener(eventName, handler));
}

function bindProp(node, name, value) {
  const assign = (nextValue) => {
    if (nextValue === false || nextValue == null) {
      removeDomValue(node, name);
      return;
    }

    if (name in node) {
      node[name] = nextValue;
    } else {
      node.setAttribute(name, String(nextValue));
    }
  };

  assign(read(value));
  bindReactive(node, value, () => assign(value.get()));
}

function bindReactive(node, value, update) {
  if (!isReactive(value)) return;
  const stop = effect(update);
  onCleanup(node, stop);
}

function removeDomValue(node, name) {
  if (name in node && typeof node[name] === "boolean") {
    node[name] = false;
  } else if (name in node) {
    node[name] = "";
  }

  node.removeAttribute(name);
}

function normalizeChildren(children) {
  const nodes = [];

  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;

    if (child instanceof Node) {
      nodes.push(child);
    } else if (isReactive(child)) {
      nodes.push(Text(child));
    } else {
      nodes.push(document.createTextNode(String(child)));
    }
  }

  return nodes;
}

function cleanupTree(node) {
  const callbacks = cleanupMap.get(node);
  if (callbacks) {
    for (const callback of callbacks) callback();
    cleanupMap.delete(node);
  }

  for (const child of [...node.childNodes]) cleanupTree(child);
}

function onCleanup(node, callback) {
  const callbacks = cleanupMap.get(node) ?? [];
  callbacks.push(callback);
  cleanupMap.set(node, callbacks);
}

function read(value) {
  return isReactive(value) ? value.get() : value;
}

function isReactive(value) {
  return value && typeof value.get === "function" && typeof value.subscribe === "function";
}

function track(source) {
  activeObserver?.depend(source);
}
