import {
  Text,
  When,
  computed,
  dom,
  html,
  signal,
} from "../src/index.js";

type BrowserTest = {
  name: string;
  fn: () => void;
};

const results = getElement("#results");
const fixture = getElement("#fixture");
const tests: BrowserTest[] = [];

test("Text updates only its text node", () => {
  const count = signal(0);
  const label = computed(() => `Count ${count.get()}`);
  const view = html.div(html.p(Text(label)));

  dom.mount(fixture, view);
  const textNode = getParagraph(view).firstChild;

  assertEqual(view.textContent, "Count 0");
  count.set(3);
  assertEqual(view.textContent, "Count 3");
  assert(textNode === getParagraph(view).firstChild, "text node should be stable");

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
  assertEqual(getParagraph(view).textContent, "Mounted");
  open.set(false);
  assertEqual(view.querySelector("p"), null);

  dom.unmount(view);
});

test("When cleans nested bindings after unmount", () => {
  const open = signal(true);
  const name = signal("Kitchen");
  const view = html.div(When(open, () => html.p(Text(name))));

  dom.mount(fixture, view);

  const firstParagraph = getParagraph(view);
  assertEqual(firstParagraph.textContent, "Kitchen");

  open.set(false);
  name.set("Office");
  assertEqual(firstParagraph.textContent, "Kitchen");

  open.set(true);
  assertEqual(getParagraph(view).textContent, "Office");
  assert(firstParagraph !== getParagraph(view), "remount should create a fresh node");

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

function test(name: string, fn: () => void) {
  tests.push({ name, fn });
}

function run(): void {
  let failed = 0;

  for (const { name, fn } of tests) {
    fixture.replaceChildren();

    try {
      fn();
      report("pass", `PASS ${name}`);
    } catch (error) {
      failed += 1;
      report("fail", `FAIL ${name}: ${getErrorMessage(error)}`);
    }
  }

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed`);
  }
}

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`expected ${format(expected)}, got ${format(actual)}`);
  }
}

function format(value: unknown): string {
  return value === null ? "null" : JSON.stringify(value);
}

function report(className: string, message: string): void {
  const row = document.createElement("div");
  row.className = className;
  row.textContent = message;
  results.append(row);
}

function getElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

function getParagraph(root: ParentNode): HTMLParagraphElement {
  const paragraph = root.querySelector("p");
  if (!paragraph) throw new Error("Missing paragraph");
  return paragraph;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
