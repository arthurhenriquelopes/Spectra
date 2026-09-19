## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-02 - Fast-Path Bypassing for Streaming Text Filters
**Learning:** In live streaming AI response processors where text chunks accumulate into growing buffers, applying regular expression replacements repeatedly on every chunk creates quadratic-like processing overhead for non-matching responses.
**Action:** Always place a cheap `String.prototype.includes()` fast-path check before expensive regex replacements on accumulating text streams to return early when no target tags are present.
