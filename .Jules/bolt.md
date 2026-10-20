## 2025-03-01 - Input Debouncing Timers in UI Controllers
**Learning:** In event handlers with broken debouncing where `clearTimeout(timer)` is called without setting `timer = setTimeout(...)`, keystrokes execute heavy async fetches, list filtering, sorting, and DOM updates synchronously on every single input event.
**Action:** When implementing or refactoring UI search/autocomplete listeners, ensure timer state is bound to class instances or proper scopes and assigned `timer = setTimeout(...)` with explicit `clearTimeout(timer)` calls on both new input and early return checks.
