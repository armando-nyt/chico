import {
  Text,
  When,
  computed,
  dom,
  html,
  signal,
  svg,
  type Readable
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

const appElement = html.div(
  { className: "site-shell" },
  SiteHeader(),
  html.main(
    HeroSection(),
    ExampleSection(),
    ApiSection(),
    PatternsSection(),
    EscapeHatchSection()
  ),
  SiteFooter()
);

const root = document.querySelector("#app");
if (!root) throw new Error("Missing #app root");

dom.mount(root, appElement);

function SiteHeader(): HTMLElement {
  return html.header(
    { className: "topbar" },
    html.a({ className: "brand", href: "#top", "aria-label": "chico home" }, Mark(), html.span("chico")),
    html.nav(
      { className: "nav", "aria-label": "Documentation" },
      NavLink("Example", "#example"),
      NavLink("API", "#api"),
      NavLink("Patterns", "#patterns"),
      NavLink("DOM", "#dom")
    )
  );
}

function HeroSection(): HTMLElement {
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
        Pill("no JSX"),
        Pill("no virtual DOM"),
        Pill("no renderer"),
        Pill("real nodes")
      )
    ),
    html.div(
      { className: "hero-visual", "aria-label": "chico DOM flow diagram" },
      DomDiagram()
    )
  );
}

function ExampleSection(): HTMLElement {
  const count = signal(0);
  const countLabel = computed(() => `Count: ${count.get()}`);

  return html.section(
    { id: "example", className: "section example-section" },
    SectionIntro(
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
      CodeBlock(`import { Text, computed, dom, html, signal } from "chico";

const count = signal(0);
const countLabel = computed(() => \`Count: \${count.get()}\`);

dom.mount(
  document.body,
  html.div(
    html.h1("Counter"),
    html.p(Text(countLabel)),
    html.button(
      { onclick: () => count.update((n) => n + 1) },
      "Increment"
    )
  )
);`)
    )
  );
}

function ApiSection(): HTMLElement {
  const items: ApiItem[] = [
    {
      name: "signal(initialValue)",
      summary: "Mutable reactive state with get, set, update, and subscribe.",
      code: "const count = signal(0);\ncount.update((n) => n + 1);"
    },
    {
      name: "computed(fn)",
      summary: "Derived readable state that tracks the signals it reads.",
      code: "const countLabel = computed(() => `Count: ${count.get()}`);"
    },
    {
      name: "effect(fn)",
      summary: "Run a reactive function and receive a stop function for cleanup.",
      code: "const stop = effect(() => console.log(count.get()));\nstop();"
    },
    {
      name: "Text(value)",
      summary: "Create a text node. Reactive values update only that node.",
      code: "html.p(\"Status: \", Text(panelStatus))"
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
    SectionIntro(
      "Core API",
      "The public surface is deliberately small. These pieces compose directly with browser APIs instead of hiding them."
    ),
    html.div({ className: "api-grid" }, items.map(ApiItem))
  );
}

function PatternsSection(): HTMLElement {
  const room = signal("Kitchen");
  const panelOpen = signal(true);
  const panelTitle = computed(() => `${room.get()} panel`);
  const panelStatus = computed(() => (panelOpen.get() ? "mounted" : "unmounted"));

  const patterns: Pattern[] = [
    {
      title: "Reactive Text",
      body: "Wrap a signal or computed value with Text when only text should change.",
      code: "html.p(\"Hello, \", Text(room))"
    },
    {
      title: "Reactive Props",
      body: "Pass readable values as props or styles and chico updates the existing node.",
      code: "html.input({ disabled, value: room })"
    },
    {
      title: "Events",
      body: "Use native event names as props. The listener is removed when the node unmounts.",
      code: "html.button({ onclick: save }, \"Save\")"
    },
    {
      title: "Conditional DOM",
      body: "When removes actual nodes and stops nested bindings when the condition turns false.",
      code: "When(panelOpen, () => PanelRegion(panelTitle))"
    },
    {
      title: "Naming Roles",
      body: "Signals stay simple; computed values and view functions are named by purpose.",
      code: "html.p(Text(panelTitle))\nWhen(panelOpen, () => PanelRegion(panelTitle))"
    }
  ];

  return html.section(
    { id: "patterns", className: "section patterns-section" },
    SectionIntro(
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
        When(panelOpen, () => PanelRegion(panelTitle))
      ),
      html.div({ className: "pattern-list" }, patterns.map(PatternItem))
    )
  );
}

function PanelRegion(title: Readable<string>): HTMLElement {
  return html.div(
    { className: "mounted-region" },
    html.h3(Text(title)),
    html.p("This block is inserted and removed from the DOM. Its nested bindings are cleaned up when it unmounts.")
  );
}

function EscapeHatchSection(): HTMLElement {
  return html.section(
    { id: "dom", className: "section dom-section" },
    SectionIntro(
      "Native DOM Escape Hatch",
      "chico returns real nodes. You can inspect them, append to them, call browser methods, or hand them to other DOM code."
    ),
    html.div(
      { className: "dom-proof" },
      html.div(
        html.h3("No wrapper object"),
        html.p("The element from html.div is an HTMLElement. The circle from svg.circle is an SVGElement.")
      ),
      CodeBlock(`const noteElement = html.div({ className: "note" }, "Saved");

noteElement instanceof HTMLElement; // true
noteElement.querySelector(".note");
noteElement.append(document.createTextNode("!"));`)
    )
  );
}

function SiteFooter(): HTMLElement {
  return html.footer(
    { className: "footer" },
    html.p("Built with chico, for chico."),
    html.a({ href: "https://github.com/armando-nyt/chico" }, "GitHub")
  );
}

function NavLink(label: string, href: string): HTMLAnchorElement {
  return html.a({ href }, label);
}

function SectionIntro(title: string, body: string): HTMLElement {
  return html.div(
    { className: "section-intro" },
    html.h2(title),
    html.p(body)
  );
}

function ApiItem(item: ApiItem): HTMLElement {
  return html.article(
    { className: "api-item" },
    html.h3(item.name),
    html.p(item.summary),
    CodeBlock(item.code)
  );
}

function PatternItem(pattern: Pattern): HTMLElement {
  return html.article(
    { className: "pattern-item" },
    html.h3(pattern.title),
    html.p(pattern.body),
    CodeBlock(pattern.code)
  );
}

function Pill(label: string): HTMLElement {
  return html.span({ className: "pill" }, label);
}

function CodeBlock(source: string): HTMLElement {
  return html.pre(html.code(source));
}

function Mark(): SVGSVGElement {
  return svg.svg(
    { class: "mark", viewBox: "0 0 32 32", role: "img", "aria-label": "chico mark" },
    svg.rect({ x: 5, y: 5, width: 22, height: 22, rx: 4 }),
    svg.path({ d: "M11 16h10M16 11v10" })
  );
}

function DomDiagram(): SVGSVGElement {
  return svg.svg(
    { class: "dom-diagram", viewBox: "0 0 720 320", role: "img", "aria-label": "Signals update DOM nodes directly" },
    svg.path({ class: "diagram-link", d: "M242 152 C304 104 372 104 446 104" }),
    svg.path({ class: "diagram-link", d: "M242 166 C304 250 372 250 446 250" }),
    DiagramNode(72, 106, "signal", "state"),
    DiagramNode(446, 58, "Text", "node"),
    DiagramNode(446, 204, "html.div", "element"),
    svg.text({ class: "diagram-caption", x: 360, y: 168, "text-anchor": "middle" }, "fine-grained bindings"),
    svg.circle({ class: "diagram-dot", cx: 246, cy: 152, r: 5 }),
    svg.circle({ class: "diagram-dot", cx: 446, cy: 104, r: 5 }),
    svg.circle({ class: "diagram-dot", cx: 246, cy: 166, r: 5 }),
    svg.circle({ class: "diagram-dot", cx: 446, cy: 250, r: 5 })
  );
}

function DiagramNode(x: number, y: number, title: string, label: string): SVGElement[] {
  return [
    svg.rect({ class: "diagram-node", x, y, width: 170, height: 92, rx: 8 }),
    svg.text({ class: "diagram-title", x: x + 24, y: y + 40 }, title),
    svg.text({ class: "diagram-label", x: x + 24, y: y + 66 }, label)
  ];
}
