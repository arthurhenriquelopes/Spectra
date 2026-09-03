## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-02 - ARIA Tab Roles & Keyboard Accessibility for Custom Interactive Card Selectors
**Learning:** Custom interactive selection cards (`div.preset-card`) and pill tab navigation in vanilla JS web components lack native keyboard focus (`tabindex="0"`), ARIA pressed/selected state synchronization, and `Enter`/`Space` keyboard event listeners, rendering them unreachable for keyboard and screen reader users.
**Action:** Always attach `role="button"` / `role="tab"`, `tabindex="0"`, dynamic `aria-pressed` / `aria-selected` attributes, and `Enter`/`Space` key event listeners to interactive `div` card selectors.
