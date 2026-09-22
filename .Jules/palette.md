## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-02 - Accessible Custom Tab Navigation in Web Overlay Components
**Learning:** Custom tab navigation components built with standard `<button>` elements lack ARIA tab list roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`) and keydown event handling, preventing screen readers from identifying tab structures and blocking keyboard users from navigating tabs using arrow keys.
**Action:** Always include `role="tablist"`, `role="tab"`, `aria-selected`, `tabindex`, and `aria-controls` on tab elements along with arrow key navigation listeners to maintain standard accessibility.
