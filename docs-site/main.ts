import {
  Text,
  When,
  computed,
  dom,
  html,
  signal,
  svg
} from "../src/index.js";

type ApiItem = {
  name: string;
  summary: string;
  code: string;
};

type Pattern = {
  title: string;
  body: string;
  code: string;
};

const count = signal(0);
const room = signal("Kitchen");
const panelOpen = signal(true);
const countLabel = computed(() => `Count: ${count.get()}`);
const roomPanel = computed(() => `${room.get()} panel`);
const panelStatus = computed(() => (panelOpen.get() ? "mounted" : "unmounted"));

const app = html.div(
  { className: "site-shell" },
  siteHeader(),
  html.main(
    heroSection(),
    exampleSection(),
    apiSection(),
    patternsSection(),
    escapeHatchSection()
  ),
  siteFooter()
);

const root = document.querySelector("#app");
if (!root) throw new Error("Missing #app root");

dom.mount(root, app);

function siteHeader(): HTMLElement {
  return html.header(
    { className: "topbar" },
    html.a({ className: "brand", href: "#top", "aria-label": "chico home" }, mark(), html.span("chico")),
    html.nav(
      { className: "nav", "aria-label": "Documentation" },
      navLink("Example", "#example"),
      navLink("API", "#api"),
      navLink("Patterns", "#patterns"),
      navLink("DOM", "#dom")
    )
  );
}

function heroSection(): HTMLElement {
  return html.section(
    { id: "top", className: "hero" },
    html.div(
      { className: "hero-copy" },
      html.p({ className: "eyebrow" }, "Tiny DOM-first reactive UI"),
      html.h1("chico"),
      html.p(
        { className: "lede" },
        "Plain TypeScript helpers for building with real browser nodes, fine-grained bindings, and an API small enough to keep in your head."
      ),
      html.div(
        { className: "principles", "aria-label": "Design principles" },
        pill("no JSX"),
        pill("no virtual DOM"),
        pill("no renderer"),
        pill("real nodes")
      )
    ),
    html.div(
      { className: "hero-visual", "aria-label": "chico DOM flow diagram" },
      domDiagram()
    )
  );
}

function exampleSection(): HTMLElement {
  return html.section(
    { id: "example", className: "section example-section" },
    sectionIntro(
      "Start With Real DOM",
      "The first example is the README counter, rendered by chico on this page. The buttons update one text node instead of re-rendering a tree."
    ),
    html.div(
      { className: "example-grid" },
      html.div(
        { className: "live-example" },
        html.div(
          { className: "counter-display" },
          html.span({ className: "counter-value" }, Text(count)),
          html.span(Text(countLabel))
        ),
        html.div(
          { className: "button-row" },
          html.button({ type: "button", onclick: () => count.update((value) => value - 1) }, "-"),
          html.button({ type: "button", onclick: () => count.update((value) => value + 1) }, "+"),
          html.button({ type: "button", onclick: () => count.set(0) }, "Reset")
        )
      ),
      codeBlock(`import { Text, computed, dom, html, signal } from "chico";

const count = signal(0);
const label = computed(() => \`Count: \${count.get()}\`);

dom.mount(
  document.body,
  html.div(
    html.h1("Counter"),
    html.p(Text(label)),
    html.button(
      { onclick: () => count.update((n) => n + 1) },
      "Increment"
    )
  )
);`)
    )
  );
}

function apiSection(): HTMLElement {
  const items: ApiItem[] = [
    {
      name: "signal(initialValue)",
      summary: "Mutable reactive state with get, set, update, and subscribe.",
      code: "const count = signal(0);\ncount.update((n) => n + 1);"
    },
    {
      name: "computed(fn)",
      summary: "Derived readable state that tracks the signals it reads.",
      code: "const label = computed(() => `Count: ${count.get()}`);"
    },
    {
      name: "effect(fn)",
      summary: "Run a reactive function and receive a stop function for cleanup.",
      code: "const stop = effect(() => console.log(count.get()));\nstop();"
    },
    {
      name: "Text(value)",
      summary: "Create a text node. Reactive values update only that node.",
      code: "html.p(\"Status: \", Text(status))"
    },
    {
      name: "When(condition, render)",
      summary: "Mount or remove a comment-anchored conditional region.",
      code: "When(open, () => html.p(\"Mounted\"))"
    },
    {
      name: "html.* and svg.*",
      summary: "Create real HTML and SVG elements with props and children.",
      code: "html.button({ type: \"button\" }, \"Save\")\nsvg.circle({ cx: 10, cy: 10, r: 4 })"
    },
    {
      name: "dom.*",
      summary: "Append, remove, and replace nodes while running chico cleanup.",
      code: "dom.mount(root, view);\ndom.unmount(view);"
    }
  ];

  return html.section(
    { id: "api", className: "section" },
    sectionIntro(
      "Core API",
      "The public surface is deliberately small. These pieces compose directly with browser APIs instead of hiding them."
    ),
    html.div({ className: "api-grid" }, items.map(apiItem))
  );
}

function patternsSection(): HTMLElement {
  const patterns: Pattern[] = [
    {
      title: "Reactive Text",
      body: "Wrap a signal or computed value with Text when only text should change.",
      code: "html.p(\"Hello, \", Text(name))"
    },
    {
      title: "Reactive Props",
      body: "Pass readable values as props or styles and chico updates the existing node.",
      code: "html.input({ disabled, value: name })"
    },
    {
      title: "Events",
      body: "Use native event names as props. The listener is removed when the node unmounts.",
      code: "html.button({ onclick: save }, \"Save\")"
    },
    {
      title: "Conditional DOM",
      body: "When removes actual nodes and stops nested bindings when the condition turns false.",
      code: "When(open, () => html.section(Text(title)))"
    }
  ];

  return html.section(
    { id: "patterns", className: "section patterns-section" },
    sectionIntro(
      "Patterns",
      "These are the normal moves: values flow through signals, and DOM nodes stay DOM nodes."
    ),
    html.div(
      { className: "patterns-layout" },
      html.div(
        { className: "interactive-pattern" },
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
        html.div(
          { className: "status-row" },
          html.span("Region is "),
          html.strong(Text(panelStatus))
        ),
        html.button({ type: "button", onclick: () => panelOpen.update((value) => !value) }, "Toggle region"),
        When(panelOpen, () =>
          html.div(
            { className: "mounted-region" },
            html.h3(Text(roomPanel)),
            html.p("This block is inserted and removed from the DOM. Its nested bindings are cleaned up when it unmounts.")
          )
        )
      ),
      html.div({ className: "pattern-list" }, patterns.map(patternItem))
    )
  );
}

function escapeHatchSection(): HTMLElement {
  return html.section(
    { id: "dom", className: "section dom-section" },
    sectionIntro(
      "Native DOM Escape Hatch",
      "chico returns real nodes. You can inspect them, append to them, call browser methods, or hand them to other DOM code."
    ),
    html.div(
      { className: "dom-proof" },
      html.div(
        html.h3("No wrapper object"),
        html.p("The element from html.div is an HTMLElement. The circle from svg.circle is an SVGElement.")
      ),
      codeBlock(`const view = html.div({ className: "note" }, "Saved");

view instanceof HTMLElement; // true
view.querySelector(".note");
view.append(document.createTextNode("!"));`)
    )
  );
}

function siteFooter(): HTMLElement {
  return html.footer(
    { className: "footer" },
    html.p("Built with chico, for chico."),
    html.a({ href: "https://github.com/armando-nyt/chico" }, "GitHub")
  );
}

function navLink(label: string, href: string): HTMLAnchorElement {
  return html.a({ href }, label);
}

function sectionIntro(title: string, body: string): HTMLElement {
  return html.div(
    { className: "section-intro" },
    html.h2(title),
    html.p(body)
  );
}

function apiItem(item: ApiItem): HTMLElement {
  return html.article(
    { className: "api-item" },
    html.h3(item.name),
    html.p(item.summary),
    codeBlock(item.code)
  );
}

function patternItem(pattern: Pattern): HTMLElement {
  return html.article(
    { className: "pattern-item" },
    html.h3(pattern.title),
    html.p(pattern.body),
    codeBlock(pattern.code)
  );
}

function pill(label: string): HTMLElement {
  return html.span({ className: "pill" }, label);
}

function codeBlock(source: string): HTMLElement {
  return html.pre(html.code(source));
}

function mark(): SVGSVGElement {
  return svg.svg(
    { class: "mark", viewBox: "0 0 32 32", role: "img", "aria-label": "chico mark" },
    svg.rect({ x: 5, y: 5, width: 22, height: 22, rx: 4 }),
    svg.path({ d: "M11 16h10M16 11v10" })
  );
}

function domDiagram(): SVGSVGElement {
  return svg.svg(
    { class: "dom-diagram", viewBox: "0 0 720 320", role: "img", "aria-label": "Signals update DOM nodes directly" },
    svg.path({ class: "diagram-link", d: "M200 160 C270 78 374 78 446 160" }),
    svg.path({ class: "diagram-link", d: "M200 160 C270 242 374 242 446 160" }),
    diagramNode(72, 106, "signal", "state"),
    diagramNode(446, 58, "Text", "node"),
    diagramNode(446, 204, "html.div", "element"),
    svg.text({ class: "diagram-caption", x: 360, y: 168, "text-anchor": "middle" }, "fine-grained bindings"),
    svg.circle({ class: "diagram-dot", cx: 206, cy: 160, r: 5 }),
    svg.circle({ class: "diagram-dot", cx: 442, cy: 160, r: 5 })
  );
}

function diagramNode(x: number, y: number, title: string, label: string): SVGElement[] {
  return [
    svg.rect({ class: "diagram-node", x, y, width: 170, height: 92, rx: 8 }),
    svg.text({ class: "diagram-title", x: x + 24, y: y + 40 }, title),
    svg.text({ class: "diagram-label", x: x + 24, y: y + 66 }, label)
  ];
}
