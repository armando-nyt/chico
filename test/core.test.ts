import { beforeEach, describe, expect, test } from "vitest";

import {
  type ElementProps,
  Text,
  When,
  computed,
  createElementNS,
  dom,
  html,
  signal,
  svg,
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

  test("computed switches dependencies and releases stale sources", () => {
    const useFirst = signal(true);
    const first = signal("first");
    const second = signal("second");
    let runs = 0;
    const label = computed(() => {
      runs += 1;
      return useFirst.get() ? first.get() : second.get();
    });

    expect(label.get()).toBe("first");
    expect(runs).toBe(1);

    useFirst.set(false);
    expect(label.get()).toBe("second");
    expect(runs).toBe(2);

    first.set("stale");
    expect(label.get()).toBe("second");
    expect(runs).toBe(2);

    second.set("fresh");
    expect(label.get()).toBe("fresh");
    expect(runs).toBe(3);
  });

  test("event listeners are removed on unmount", () => {
    const fixture = getFixture();
    let clicks = 0;
    const button = html.button({ onclick: () => clicks += 1 }, "Click");

    dom.mount(fixture, button);
    button.click();
    expect(clicks).toBe(1);

    dom.unmount(button);
    button.click();
    expect(clicks).toBe(1);
  });

  test("reactive props and styles remove nullish and false values", () => {
    const fixture = getFixture();
    const title = signal<string | null>("Ready");
    const hidden = signal(false);
    const color = signal<string | null>("red");
    const view = html.div({
      hidden,
      title,
      style: { color }
    });

    dom.mount(fixture, view);

    expect(view.hidden).toBe(false);
    expect(view.getAttribute("title")).toBe("Ready");
    expect(view.style.color).toBe("red");

    hidden.set(true);
    title.set(null);
    color.set(null);

    expect(view.hidden).toBe(true);
    expect(view.hasAttribute("title")).toBe(false);
    expect(view.style.color).toBe("");

    hidden.set(false);
    expect(view.hidden).toBe(false);
    expect(view.hasAttribute("hidden")).toBe(false);

    dom.unmount(view);
  });

  test("normalizes nested arrays and skips empty children", () => {
    const view = html.div(
      "A",
      [null, false, ["B", html.span("C")]],
      undefined,
      true,
      4
    );

    expect(view.childNodes).toHaveLength(5);
    expect(view.textContent).toBe("ABCtrue4");
    expect(view.querySelector("span")?.textContent).toBe("C");
  });

  test("dom.replace swaps nodes and cleans old bindings", () => {
    const fixture = getFixture();
    const value = signal("old");
    const oldChild = html.p(Text(value));

    dom.mount(fixture, oldChild);
    const replacement = html.div("new");
    const returned = dom.replace(fixture, oldChild, replacement);

    expect(returned).toBe(replacement);
    expect(fixture.textContent).toBe("new");

    value.set("stale");
    expect(oldChild.textContent).toBe("old");
  });

  test("dom.replace supports multiple replacement children", () => {
    const fixture = getFixture();
    const oldChild = html.p("old");

    dom.mount(fixture, oldChild);
    const returned = dom.replace(fixture, oldChild, [html.span("A"), "B"]);

    expect(Array.isArray(returned)).toBe(true);
    expect(fixture.childNodes).toHaveLength(2);
    expect(fixture.textContent).toBe("AB");
  });

  test("svg namespace factories create SVG nodes and bind attributes", () => {
    const fixture = getFixture();
    const radius = signal(10);
    const icon = svg.svg(
      { viewBox: "0 0 20 20" },
      svg.circle({ cx: 10, cy: 10, r: radius })
    );

    dom.mount(fixture, icon);
    const circle = icon.querySelector("circle");

    expect(icon.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(circle?.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(circle?.getAttribute("r")).toBe("10");

    radius.set(4);
    expect(circle?.getAttribute("r")).toBe("4");

    dom.unmount(icon);
  });

  test("createElementNS supports custom namespaces", () => {
    const node = createElementNS("urn:example", "thing", { id: "custom" });

    expect(node.namespaceURI).toBe("urn:example");
    expect(node.tagName).toBe("thing");
    expect(node.getAttribute("id")).toBe("custom");
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
