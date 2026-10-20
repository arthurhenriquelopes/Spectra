## 2025-03-01 - Explicit ARIA Labels & Button Types for Web Overlay Inputs & Actions
**Learning:** In PyWebView overlay applications, form inputs using `placeholder` without explicit `aria-label` or `<label>` tags and dynamically created icon buttons (e.g. `+`, `×`, `↓`) lack accessible names and explicit `type="button"` attributes, causing screen readers to misidentify or misannounce interactive controls.
**Action:** Always provide `aria-label` attributes for form inputs and set `type="button"` along with `aria-label` on dynamically constructed icon-only control buttons in web components.

## 2025-03-01 - Dynamic ARIA Label Feedback for Async Icon-Only Actions
**Learning:** Icon-only buttons with visual state changes (such as copy buttons changing from 📋 to ✅ or ❌) must dynamically update their `aria-label` attribute alongside `textContent` so screen readers announce completion/failure status to users relying on assistive technology.
**Action:** Always update `aria-label` dynamically during async action feedback states (e.g. "Code copied to clipboard", "Failed to copy code") and reset it when restoring the default icon state.
