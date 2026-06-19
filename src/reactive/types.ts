export type Subscriber = () => void;
export type Cleanup = () => void;

export type Readable<T> = {
  get(): T;
  subscribe(subscriber: Subscriber): Cleanup;
};

export type Signal<T> = Readable<T> & {
  set(nextValue: T): void;
  update(fn: (value: T) => T): void;
};

export type ReactiveSource = Readable<unknown>;

export type Observer = {
  depend(source: ReactiveSource): void;
};

export type MaybeReactive<T> = T | Readable<T>;
