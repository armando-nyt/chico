import {
  Text,
  When,
  computed,
  dom,
  html,
  signal
} from "../src/index.js";

const count = signal(0);
const isOpen = signal(true);
const name = signal("Kitchen");

const countLabel = computed(() => `Count: ${count.get()}`);
const status = computed(() => (isOpen.get() ? "Mounted" : "Unmounted"));
const greeting = computed(() => `${name.get()} panel`);

const app = html.main(
  { className: "shell" },
  html.header(
    { className: "hero" },
    html.div(
      html.h1("Tiny DOM-First UI"),
      html.p("Plain JavaScript helpers for real DOM nodes and fine-grained bindings.")
    )
  ),
  html.section(
    { className: "grid" },
    html.div(
      { className: "panel" },
      html.h2("Signals"),
      html.p(Text(countLabel)),
      html.div(
        { className: "toolbar" },
        html.button({ onclick: () => count.update((value) => value - 1) }, "-"),
        html.button({ onclick: () => count.update((value) => value + 1) }, "+"),
        html.button({ onclick: () => count.set(0) }, "Reset")
      )
    ),
    html.div(
      { className: "panel" },
      html.h2("Computed Text"),
      html.label(
        { className: "field" },
        html.span("Room"),
        html.input({
          value: name,
          oninput: (event: Event) => {
            const input = event.currentTarget;
            if (input instanceof HTMLInputElement) name.set(input.value);
          }
        })
      ),
      html.p(html.strong(Text(greeting)))
    ),
    html.div(
      { className: "panel wide" },
      html.h2("Conditional Region"),
      html.p("Status: ", Text(status)),
      html.button({ onclick: () => isOpen.update((value) => !value) }, "Toggle region"),
      When(isOpen, () =>
        html.div(
          { className: "mounted-region" },
          html.h2(Text(greeting)),
          html.p("This block is inserted and removed from the DOM."),
          html.p("Its nested text binding is cleaned up when unmounted.")
        )
      )
    )
  )
);

const root = document.querySelector("#app");
if (!root) throw new Error("Missing #app root");

dom.mount(root, app);
