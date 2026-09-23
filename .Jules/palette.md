## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-24 - WAI-ARIA Tab Navigation for Multi-Step Onboarding Views
**Learning:** Single-page app onboarding panels rendered with generic `<button>` and `<div>` elements fail screen reader announcement of active step context and lack keyboard arrow key navigation between steps.
**Action:** Always wrap onboarding step controls in a `role="tablist"` container, assign `role="tab"`, `aria-selected`, and `aria-controls` to tab buttons, set `role="tabpanel"` on content panes, and bind `ArrowLeft`/`ArrowRight` key handlers for accessible step switching.
