import type { Observer, ReactiveSource } from "./types.js";

let activeObserver: Observer | null = null;

export function withObserver<T>(observer: Observer, fn: () => T): T {
  const previousObserver = activeObserver;
  activeObserver = observer;

  try {
    return fn();
  } finally {
    activeObserver = previousObserver;
  }
}

export function track(source: ReactiveSource): void {
  activeObserver?.depend(source);
}
