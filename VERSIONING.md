## Philosophy

Chico is intentionally small. It is not a framework and does not require a
complex release process. The source code and git history are the primary
artifacts.

Versioning exists to communicate API stability and provide reference points for
users, not to support package infrastructure.

---

## Distribution

Chico does not need to be published to npm.

Possible distribution methods:

- Vendor the source directly into projects.
- Reference the repository as a git dependency.
- Download versioned release artifacts from GitHub Releases.
- Self-host the ESM files.
- Use starter repositories containing Chico.

The guiding principle is:

> Chico should be small enough to own.

Users should be able to read it, modify it, and remove it without friction.

---

## Source of Truth

Git tags are the source of truth.

A project that vendors Chico should be able to record:

```txt
Vendored from chico v0.1.0
```

The tag identifies exactly which version was used.

---

## Pre-1.0 Versioning

Before 1.0, version numbers indicate progress rather than compatibility
guarantees.

Examples:

```txt
v0.1.0  Initial stable shape
v0.1.1  Bug fixes and documentation
v0.2.0  API changes or breaking changes
v0.3.0  Additional capabilities
```

### Rules for 0.x

Patch versions:

- Bug fixes
- Documentation improvements
- Internal refactoring

Minor versions:

- New public APIs
- Changes to existing APIs
- Breaking changes

Because the API is still evolving, breaking changes are acceptable during 0.x.

---

## Version 1.0

Version 1.0 means:

> The public API is considered stable and future changes will prioritize backward
> compatibility.

Once 1.0 is reached:

### Patch Versions

Bug fixes only.

```txt
1.0.1
1.0.2
```

### Minor Versions

Backward-compatible additions.

```txt
1.1.0
1.2.0
```

### Major Versions

Breaking changes.

```txt
2.0.0
3.0.0
```

---

## Stable API Surface

The goal is to stabilize the conceptual shape rather than every internal
implementation.

Potential stable APIs:

```ts
html.*
svg.*

signal()
computed()

effect()

dom.mount()
dom.unmount()
dom.replace()
```

Internals remain free to evolve.

---

## Optional Package Distribution

Package registries are conveniences, not the source of truth.

### Git Dependency

Consumers may depend directly on a tagged release:

```json
{
  "dependencies": {
    "chico": "github:armando-nyt/chico#v0.1.0"
  }
}
```

Benefits:

- Uses the same git tags that define releases.
- Avoids maintaining a separate publishing workflow.
- Consumers know exactly which source revision they are using.
- Reduces reliance on the npm registry.

When installed from git, npm runs Chico's `prepare` script and builds the `dist`
files used by the package exports.

### Package Registry Distribution

Chico may optionally be published to npm or JSR.

The package should:

- Be built automatically from tagged releases.
- Use trusted publishing and provenance.
- Be treated as a distribution mechanism, not the canonical source.

For example:

```bash
npm install chico@0.1.0
```

should correspond directly to:

```txt
git tag v0.1.0
```

### CDN Distribution

Package publication enables optional CDN usage:

```ts
import { html, signal } from "https://esm.sh/chico@0.1.0";
```

This remains a convenience rather than a primary distribution method.

### Distribution Hierarchy

```txt
Git tag
    ↓
GitHub release
    ↓
Optional package publication
    ↓
Optional CDN availability
```

Never the reverse.

No distribution channel should become more important than the source itself.

---

## Repository Files

Maintain:

```txt
CHANGELOG.md
VERSIONING.md
```

### CHANGELOG.md

Records notable changes between releases.

### VERSIONING.md

Explains the versioning philosophy and release process.

---

## Release Process

1. Update the changelog.

2. Commit release changes.

```bash
git add CHANGELOG.md VERSIONING.md package.json package-lock.json
git commit -m "chore: prepare v0.1.0"
```

3. Create a tag.

```bash
git tag v0.1.0
git push origin main --tags
```

The tag itself defines the release.

---

## Release Artifacts

GitHub Releases may optionally contain:

```txt
chico.js
chico.min.js
chico.d.ts
```

These artifacts are conveniences, not the source of truth.

---

## Guiding Principle

Keep versioning simple.

Avoid:

- Automated semantic release pipelines.
- Heavy package infrastructure.
- Release processes that exceed the complexity of the library itself.

Versioning should communicate stability, not create overhead.

The simpler Chico remains, the easier it is for users to understand, adopt, and
ultimately own.

> Chico should be small enough to own.
>
> Users should be able to read it, modify it, and remove it without friction.
>
> Git tags are the source of truth.
