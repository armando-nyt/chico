import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";

import {
  Text,
  When,
  computed,
  dom,
  html,
  signal,
} from "../src/index.js";

beforeEach(() => {
  const dom = new JSDOM("<!doctype html><body><div id=\"fixture\"></div></body>");
  globalThis.document = dom.window.document;
  globalThis.Node = dom.window.Node;
});

test("Text updates only its text node", () => {
  const fixture = document.querySelector("#fixture");
  const count = signal(0);
  const label = computed(() => `Count ${count.get()}`);
  const view = html.div(html.p(Text(label)));

  dom.mount(fixture, view);
  const textNode = view.querySelector("p").firstChild;

  assert.equal(view.textContent, "Count 0");
  count.set(3);
  assert.equal(view.textContent, "Count 3");
  assert.equal(textNode, view.querySelector("p").firstChild);

  dom.unmount(view);
});

test("reactive attributes and styles update in place", () => {
  const fixture = document.querySelector("#fixture");
  const disabled = signal(false);
  const color = signal("red");
  const input = html.input({
    disabled,
    style: { color }
  });

  dom.mount(fixture, input);

  assert.equal(input.disabled, false);
  assert.equal(input.style.color, "red");

  disabled.set(true);
  color.set("blue");

  assert.equal(input.disabled, true);
  assert.equal(input.style.color, "blue");

  dom.unmount(input);
});

test("When mounts and removes real DOM", () => {
  const fixture = document.querySelector("#fixture");
  const open = signal(false);
  const view = html.div(When(open, () => html.p("Mounted")));

  dom.mount(fixture, view);

  assert.equal(view.querySelector("p"), null);
  open.set(true);
  assert.equal(view.querySelector("p").textContent, "Mounted");
  open.set(false);
  assert.equal(view.querySelector("p"), null);

  dom.unmount(view);
});

test("When cleans nested bindings after unmount", () => {
  const fixture = document.querySelector("#fixture");
  const open = signal(true);
  const name = signal("Kitchen");
  const view = html.div(When(open, () => html.p(Text(name))));

  dom.mount(fixture, view);

  const firstParagraph = view.querySelector("p");
  assert.equal(firstParagraph.textContent, "Kitchen");

  open.set(false);
  name.set("Office");
  assert.equal(firstParagraph.textContent, "Kitchen");

  open.set(true);
  assert.equal(view.querySelector("p").textContent, "Office");
  assert.notEqual(firstParagraph, view.querySelector("p"));

  dom.unmount(view);
});

test("unmount stops text bindings", () => {
  const fixture = document.querySelector("#fixture");
  const count = signal(1);
  const view = html.div(Text(count));

  dom.mount(fixture, view);
  dom.unmount(view);
  count.set(2);

  assert.equal(view.textContent, "1");
});
