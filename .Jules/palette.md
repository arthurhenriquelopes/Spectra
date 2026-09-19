## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-02 - Accessible Tab Navigation & Interactive Card Controls
**Learning:** Custom tab navigation bars and selectable card lists built with generic `<button>` or `<div>` elements without ARIA tab/radio roles (`role="tablist"`, `role="tab"`, `role="radiogroup"`, `role="radio"`), `aria-selected`/`aria-checked` states, and arrow/keyboard listeners prevent screen readers and keyboard users from navigating or selecting options.
**Action:** Always provide explicit ARIA roles, `aria-selected`/`aria-checked` attributes, `tabindex` management, and keyboard event handlers (Arrow keys, Enter, Space) for custom tabs and interactive option cards.
