import {
  Text,
  When,
  computed,
  dom,
  html,
  signal
} from "../src/index.js";

const count = signal(0);
const panelOpen = signal(true);
const room = signal("Kitchen");

const countLabel = computed(() => `Count: ${count.get()}`);
const panelStatus = computed(() => (panelOpen.get() ? "Mounted" : "Unmounted"));
const panelTitle = computed(() => `${room.get()} panel`);

const app = html.main(
  { className: "shell" },
  html.header(
    { className: "hero" },
    html.div(
      html.h1("chico"),
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
          value: room,
          oninput: (event: Event) => {
            const input = event.currentTarget;
            if (input instanceof HTMLInputElement) room.set(input.value);
          }
        })
      ),
      html.p(html.strong(Text(panelTitle)))
    ),
    html.div(
      { className: "panel wide" },
      html.h2("Conditional Region"),
      html.p("Status: ", Text(panelStatus)),
      html.button({ onclick: () => panelOpen.update((value) => !value) }, "Toggle region"),
      When(panelOpen, () =>
        html.div(
          { className: "mounted-region" },
          html.h2(Text(panelTitle)),
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
