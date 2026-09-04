## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-02 - Keyboard Interaction & ARIA Roles for Custom Preset Cards & Tab Bars
**Learning:** Custom selection cards and tab navigation implemented as generic `<div>` elements without `role="button"` or `role="tab"`, `tabindex="0"`, `aria-pressed` / `aria-selected` attributes, and `keydown` event listeners for Enter/Space keys are completely invisible and unselectable to keyboard-only users and screen readers.
**Action:** When building custom card options or tab controls, add explicit ARIA roles, tabindex="0", state attributes (`aria-pressed`/`aria-selected`), focus-visible CSS indicators, and keyboard event handlers.
