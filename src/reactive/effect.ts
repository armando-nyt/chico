import { withObserver } from "./tracking.js";
import type { Cleanup, ReactiveSource } from "./types.js";

export function effect(fn: () => void): Cleanup {
  const dependencies = new Map<ReactiveSource, Cleanup>();
  let stopped = false;

  const observer = {
    depend(source: ReactiveSource) {
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
    withObserver(observer, fn);
  }

  run();

  return () => {
    stopped = true;
    clearDependencies();
  };
}
