## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-03 - Accessible Preset Cards & Tab Structure for Web Overlays
**Learning:** Custom interactive UI elements built with generic elements (like `.preset-card` `<div>`s or `.tab-btn` without ARIA roles) lack keyboard navigation support (`tabindex="0"`, `Enter`/`Space` handlers) and ARIA states (`aria-pressed`, `aria-selected`, `aria-controls`), preventing keyboard users and screen readers from discovering or interacting with key setup options.
**Action:** Always decorate custom interactive card grids with `role="button"`, `tabindex="0"`, `aria-pressed`, and keyboard listeners, and structure tabbed interfaces with `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, and `aria-controls`.
