## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-02 - Accessible Custom Card Controls with Keyboard and ARIA States
**Learning:** Custom selection components like card grids (e.g. preset cards) built using `div` elements without `role="button"`, `tabindex="0"`, `aria-pressed`, or keyboard event listeners (`Enter`/`Space`) are completely unreachable for keyboard and screen reader users.
**Action:** When creating interactive card or tile options, assign `role="button"`, `tabindex="0"`, explicit `aria-label`, and update `aria-pressed="true|false"` dynamically alongside `keydown` handlers for `Enter` and `Space`.
