## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-05-18 - Keyboard Navigation & ARIA Pressed States for Custom Card Selectors & Tabs
**Learning:** Custom interactive div components (such as preset cards) and tab navigation buttons lack keyboard focus and state indication unless explicitly given `role="button"`, `tabindex="0"`, `aria-pressed`/`aria-selected`, and `keydown` handlers for Enter/Space keys.
**Action:** Always add `role="button"`, `tabindex="0"`, `aria-pressed`, and Enter/Space `keydown` event listeners to interactive custom div components and update ARIA states dynamically on user interaction.
