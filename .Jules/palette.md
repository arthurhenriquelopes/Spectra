## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-02 - Accessible Tab Navigation & Preset Cards in Vanilla JS Overlays
**Learning:** Custom interactive components (like preset selector cards or tab pills) styled as `<div>` or `<button>` elements without explicit ARIA roles (`role="radio"`, `role="tab"`) and dynamic state attributes (`aria-checked`, `aria-selected`) prevent screen readers from announcing options correctly and prevent keyboard-only users from interacting with options via Space/Enter and Arrow keys.
**Action:** Always pair custom interactive card/tab components with `role`, `tabindex="0"`, `aria-checked`/`aria-selected`, and keydown event listeners (`Enter`, `Space`, `ArrowLeft`/`ArrowRight`) to ensure full keyboard and screen reader parity.
