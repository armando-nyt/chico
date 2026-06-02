import {
  Text,
  When,
  computed,
  dom,
  html,
  signal,
} from "../src/index.js";

const results = document.querySelector("#results");
const fixture = document.querySelector("#fixture");
const tests = [];

test("Text updates only its text node", () => {
  const count = signal(0);
  const label = computed(() => `Count ${count.get()}`);
  const view = html.div(html.p(Text(label)));

  dom.mount(fixture, view);
  const textNode = view.querySelector("p").firstChild;

  assertEqual(view.textContent, "Count 0");
  count.set(3);
  assertEqual(view.textContent, "Count 3");
  assert(textNode === view.querySelector("p").firstChild, "text node should be stable");

  dom.unmount(view);
});

test("Reactive attributes and styles update in place", () => {
  const disabled = signal(false);
  const color = signal("red");
  const input = html.input({
    disabled,
    style: { color }
  });

  dom.mount(fixture, input);

  assertEqual(input.disabled, false);
  assertEqual(input.style.color, "red");

  disabled.set(true);
  color.set("blue");

  assertEqual(input.disabled, true);
  assertEqual(input.style.color, "blue");

  dom.unmount(input);
});

test("When mounts and removes real DOM", () => {
  const open = signal(false);
  const view = html.div(When(open, () => html.p("Mounted")));

  dom.mount(fixture, view);

  assertEqual(view.querySelector("p"), null);
  open.set(true);
  assertEqual(view.querySelector("p").textContent, "Mounted");
  open.set(false);
  assertEqual(view.querySelector("p"), null);

  dom.unmount(view);
});

test("When cleans nested bindings after unmount", () => {
  const open = signal(true);
  const name = signal("Kitchen");
  const view = html.div(When(open, () => html.p(Text(name))));

  dom.mount(fixture, view);

  const firstParagraph = view.querySelector("p");
  assertEqual(firstParagraph.textContent, "Kitchen");

  open.set(false);
  name.set("Office");
  assertEqual(firstParagraph.textContent, "Kitchen");

  open.set(true);
  assertEqual(view.querySelector("p").textContent, "Office");
  assert(firstParagraph !== view.querySelector("p"), "remount should create a fresh node");

  dom.unmount(view);
});

test("Unmount stops text bindings", () => {
  const count = signal(1);
  const view = html.div(Text(count));

  dom.mount(fixture, view);
  dom.unmount(view);
  count.set(2);

  assertEqual(view.textContent, "1");
});

run();

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  let failed = 0;

  for (const { name, fn } of tests) {
    fixture.replaceChildren();

    try {
      fn();
      report("pass", `PASS ${name}`);
    } catch (error) {
      failed += 1;
      report("fail", `FAIL ${name}: ${error.message}`);
    }
  }

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed`);
  }
}

function assert(value, message) {
  if (!value) throw new Error(message);
}

function assertEqual(actual, expected) {
  if (!Object.is(actual, expected)) {
    throw new Error(`expected ${format(expected)}, got ${format(actual)}`);
  }
}

function format(value) {
  return value === null ? "null" : JSON.stringify(value);
}

function report(className, message) {
  const row = document.createElement("div");
  row.className = className;
  row.textContent = message;
  results.append(row);
}
