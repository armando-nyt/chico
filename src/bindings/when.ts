import { normalizeChildren } from "../dom/children.js";
import { onCleanup } from "../dom/cleanup.js";
import { unmount } from "../dom/mount.js";
import type { ElementChild } from "../dom/types.js";
import { effect } from "../reactive/effect.js";
import { read } from "../reactive/read.js";
import type { MaybeReactive } from "../reactive/types.js";

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
