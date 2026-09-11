## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-02 - Accessible Tablists and Interactive Selection Cards
**Learning:** Custom interactive elements like preset selection cards (`.preset-card`) and pill-style tab buttons (`.tab-btn`) created with `<div>` or standard `<button>` tags often lack ARIA roles (`role="tablist"`, `role="tab"`, `role="button"`), press states (`aria-pressed`, `aria-selected`), and keyboard activation handlers (Enter/Space), preventing screen readers and keyboard users from navigating options.
**Action:** Always decorate custom card selectors with `role="button"`, `tabindex="0"`, and `aria-pressed`, wire `keydown` listeners for Enter/Space keys, and pair tab lists with `role="tablist"` and `aria-selected`.
