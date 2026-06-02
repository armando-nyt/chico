import {
  Button,
  Div,
  H1,
  H2,
  Header,
  Input,
  Label,
  Main,
  P,
  Section,
  Span,
  Strong,
  Text,
  When,
  computed,
  mount,
  signal
} from "../src/index.js";

const count = signal(0);
const isOpen = signal(true);
const name = signal("Kitchen");

const countLabel = computed(() => `Count: ${count.get()}`);
const status = computed(() => (isOpen.get() ? "Mounted" : "Unmounted"));
const greeting = computed(() => `${name.get()} panel`);

const app = Main(
  { className: "shell" },
  Header(
    { className: "hero" },
    Div(
      null,
      H1(null, "Tiny DOM-First UI"),
      P(null, "Plain JavaScript helpers for real DOM nodes and fine-grained bindings.")
    )
  ),
  Section(
    { className: "grid" },
    Div(
      { className: "panel" },
      H2(null, "Signals"),
      P(null, Text(countLabel)),
      Div(
        { className: "toolbar" },
        Button({ onclick: () => count.update((value) => value - 1) }, "-"),
        Button({ onclick: () => count.update((value) => value + 1) }, "+"),
        Button({ onclick: () => count.set(0) }, "Reset")
      )
    ),
    Div(
      { className: "panel" },
      H2(null, "Computed Text"),
      Label(
        { className: "field" },
        Span(null, "Room"),
        Input({
          value: name,
          oninput: (event) => name.set(event.currentTarget.value)
        })
      ),
      P(null, Strong(null, Text(greeting)))
    ),
    Div(
      { className: "panel wide" },
      H2(null, "Conditional Region"),
      P(null, "Status: ", Text(status)),
      Button({ onclick: () => isOpen.update((value) => !value) }, "Toggle region"),
      When(isOpen, () =>
        Div(
          { className: "mounted-region" },
          H2(null, Text(greeting)),
          P(null, "This block is inserted and removed from the DOM."),
          P(null, "Its nested text binding is cleaned up when unmounted.")
        )
      )
    )
  )
);

mount(document.querySelector("#app"), app);
