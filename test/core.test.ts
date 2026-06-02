import { beforeEach, describe, expect, test } from "vitest";

import {
  type ElementProps,
  Text,
  When,
  computed,
  dom,
  html,
  signal,
} from "../src/index.js";

beforeEach(() => {
  document.body.innerHTML = "<div id=\"fixture\"></div>";
});

const cssStyleProps = {
  style: {
    "background-color": "red",
    color: "white",
    "-webkit-line-clamp": 2,
    "--brand-color": "blue"
  }
} satisfies ElementProps;

const jsStyleProps = {
  style: {
    // @ts-expect-error CSS property names use CSS spelling, not JS camelCase.
    backgroundColor: "red"
  }
} satisfies ElementProps;

void cssStyleProps;
void jsStyleProps;

describe("core DOM bindings", () => {
  test("Text updates only its text node", () => {
    const fixture = getFixture();
    const count = signal(0);
    const label = computed(() => `Count ${count.get()}`);
    const view = html.div(html.p(Text(label)));

    dom.mount(fixture, view);
    const textNode = getParagraph(view).firstChild;

    expect(view.textContent).toBe("Count 0");
    count.set(3);
    expect(view.textContent).toBe("Count 3");
    expect(textNode).toBe(getParagraph(view).firstChild);

    dom.unmount(view);
  });

  test("reactive attributes and styles update in place", () => {
    const fixture = getFixture();
    const disabled = signal(false);
    const color = signal("red");
    const input = html.input({
      disabled,
      style: { color }
    });

    dom.mount(fixture, input);

    expect(input.disabled).toBe(false);
    expect(input.style.color).toBe("red");

    disabled.set(true);
    color.set("blue");

    expect(input.disabled).toBe(true);
    expect(input.style.color).toBe("blue");

    dom.unmount(input);
  });

  test("When mounts and removes real DOM", () => {
    const fixture = getFixture();
    const open = signal(false);
    const view = html.div(When(open, () => html.p("Mounted")));

    dom.mount(fixture, view);

    expect(view.querySelector("p")).toBeNull();
    open.set(true);
    expect(getParagraph(view).textContent).toBe("Mounted");
    open.set(false);
    expect(view.querySelector("p")).toBeNull();

    dom.unmount(view);
  });

  test("When cleans nested bindings after unmount", () => {
    const fixture = getFixture();
    const open = signal(true);
    const name = signal("Kitchen");
    const view = html.div(When(open, () => html.p(Text(name))));

    dom.mount(fixture, view);

    const firstParagraph = getParagraph(view);
    expect(firstParagraph.textContent).toBe("Kitchen");

    open.set(false);
    name.set("Office");
    expect(firstParagraph.textContent).toBe("Kitchen");

    open.set(true);
    expect(getParagraph(view).textContent).toBe("Office");
    expect(firstParagraph).not.toBe(getParagraph(view));

    dom.unmount(view);
  });

  test("directly mounted When unmounts its DOM and bindings", () => {
    const fixture = getFixture();
    const open = signal(true);
    const name = signal("Kitchen");
    const mounted = dom.mount(fixture, When(open, () => html.p(Text(name))));

    const paragraph = getParagraph(fixture);
    expect(paragraph.textContent).toBe("Kitchen");

    dom.unmount(mounted);
    name.set("Office");
    open.set(false);
    open.set(true);

    expect(fixture.childNodes).toHaveLength(0);
    expect(paragraph.textContent).toBe("Kitchen");
  });

  test("unmount stops text bindings", () => {
    const fixture = getFixture();
    const count = signal(1);
    const view = html.div(Text(count));

    dom.mount(fixture, view);
    dom.unmount(view);
    count.set(2);

    expect(view.textContent).toBe("1");
  });

  test("unmount releases computed dependencies", () => {
    const fixture = getFixture();
    const count = signal(1);
    let runs = 0;
    const label = computed(() => {
      runs += 1;
      return `Count ${count.get()}`;
    });
    const view = html.div(Text(label));

    dom.mount(fixture, view);
    expect(view.textContent).toBe("Count 1");
    expect(runs).toBe(1);

    dom.unmount(view);
    count.set(2);

    expect(view.textContent).toBe("Count 1");
    expect(runs).toBe(1);
  });
});

function getFixture(): HTMLElement {
  const fixture = document.querySelector<HTMLElement>("#fixture");
  if (!fixture) throw new Error("Missing #fixture");
  return fixture;
}

function getParagraph(root: ParentNode): HTMLParagraphElement {
  const paragraph = root.querySelector("p");
  if (!paragraph) throw new Error("Missing paragraph");
  return paragraph;
}
