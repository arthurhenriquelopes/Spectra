## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-02 - Accessible Interactive Card Containers
**Learning:** Custom interactive selector cards (like preset toggles) represented by standard `<div>` elements are inaccessible to keyboard and screen-reader users when missing `role="button"`, `tabindex="0"`, `aria-pressed`, and keyboard listener mappings (`Enter`/`Space`).
**Action:** When converting container elements into custom interactive selection controls, always attach `role="button"`, `tabindex="0"`, dynamic `aria-pressed` state attributes, and keyboard listeners for `Enter` and `Space`.
