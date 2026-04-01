# 📁 Frontend Folder Structure Rules

## ✅ DO

### 1. Group by Feature

Keep related files (components, pages, services) inside one feature folder for better scalability.

### 2. Use `shared/` for Reusables

Store only common components, hooks, and utilities used across multiple features.

### 3. One Responsibility per File

Each file should handle only one concern (UI, logic, or API).

### 4. Use Clear Naming

File names should clearly describe their purpose and functionality.

### 5. Use Index Files

Optional, but helps simplify imports and keeps code clean.

### 6. Limit Folder Depth

Avoid deep nesting; keep structure simple (max 3–4 levels).

### 7. Keep Pages Thin

Pages should only handle layout and structure, not logic or API calls.

### 8. Use Hooks for Logic

Move reusable logic into custom hooks instead of components.

---

## ❌ DON'T

### 1. Don’t Mix Everything

Avoid combining UI, logic, and API in a single file.

### 2. Don’t Overuse Global State

Use global state only when necessary; prefer local state for simple cases.

### 3. Don’t Duplicate Logic

Avoid copy-pasting; reuse logic via hooks or shared utilities.

### 4. Don’t Create Huge Components

Break large components into smaller, manageable parts.

### 5. Don’t Call APIs in Components

Always use a service layer for API calls instead of direct usage inside components.

---

## 🧠 Golden Rule

Keep related things together and unrelated things separate.

---

## 🧭 Project Standard (Use This)

Use this structure in this project:

```text
src/
	core/
		api/      -> API client + feature API services
		hooks/    -> reusable app hooks
		store/    -> global state (Zustand)
		utils/    -> pure helper functions
	types/      -> shared TypeScript contracts only
	pages/      -> route-level thin pages
	shared/
		components/ui/ -> reusable UI components
		layouts/       -> app/auth layouts
```

### Where to Put Files

1. `core/api/`
- HTTP client setup and service functions.
- Example: authApi, bookingApi.

2. `core/hooks/`
- Reusable React logic (`useXxx`), no direct page rendering.

3. `core/store/`
- Global app state used across multiple routes/components.

4. `core/utils/`
- Pure helper functions, no React state/effects.

5. `types/`
- Interfaces and types only, no runtime logic.

6. `features/<feature-name>/components/`
- Feature-specific UI blocks and sections.
- Keep business logic out of route pages and move it here.

7. `features/<feature-name>/hooks/`
- Feature-specific reusable hooks.
- Use this when hook logic is not global enough for `core/hooks`.

8. `features/<feature-name>/services/`
- Feature-local service wrappers if needed.
- Prefer `core/api` for shared API clients and shared endpoint access.

9. `pages/`
- Route wrappers/composition only.
- Import and compose feature components.
- Keep API calls and heavy logic out of pages.

10. `shared/components/ui/`
- Common buttons, inputs, cards, modals used by many features.

11. `shared/layouts/`
- Top-level layout structures (auth layout, main app layout).

### Keep It Scalable

1. Start folders flat when small.
2. Create subfolders by domain when files grow (3+ related files).
3. Prefer feature grouping over technical scattering.
