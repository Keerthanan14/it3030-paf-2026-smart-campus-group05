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
