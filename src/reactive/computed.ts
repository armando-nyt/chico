import { track, withObserver } from "./tracking.js";
import type { Cleanup, Readable, ReactiveSource, Subscriber } from "./types.js";

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
        if (subscribers.size === 0) {
          clearDependencies();
          dirty = true;
        }
      };
    }
  };

  function clearDependencies() {
    for (const unsubscribe of dependencies.values()) unsubscribe();
    dependencies.clear();
  }

  function recompute() {
    clearDependencies();

    withObserver(
      {
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
      },
      () => {
        value = fn();
        dirty = false;
      }
    );
  }

  return api;
}
