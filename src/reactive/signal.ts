import { track } from "./tracking.js";
import type { Signal, Subscriber } from "./types.js";

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
