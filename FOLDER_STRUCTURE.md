# Project Folder Structure

## Overview
This document describes the recommended folder structure for the Claude Code Figma project.

```
src/
├── components/                    # All React components
│   ├── pages/                     # Page-level components (routed pages)
│   │   ├── LoginPage.jsx
│   │   ├── AgentPage.jsx
│   │   ├── TenantListPage.jsx
│   │   └── ... (all page components)
│   │
│   ├── layout/                    # Layout components (header, sidebar, footer)
│   │   ├── AppHeader.jsx
│   │   ├── Sidebar.jsx
│   │   └── NotificationPanel.jsx
│   │
│   ├── features/                  # Feature-specific components
│   │   ├── agent-detail/          # Agent detail feature
│   │   ├── chat/                  # Chat feature
│   │   ├── examples/              # Component examples
│   │   └── ... (other features)
│   │
│   ├── common/                    # Reusable components
│   │   ├── ExpandableSearch.jsx
│   │   ├── KnowledgeHubPicker.jsx
│   │   ├── ProviderLogo.jsx
│   │   ├── RichMessage.jsx
│   │   ├── VoiceOrb.jsx
│   │   └── VoiceConversation.jsx
│   │
│   └── ui/                        # Design system & shadcn components
│       ├── button.jsx
│       ├── dialog.jsx
│       ├── sidebar.jsx
│       └── ... (all UI primitives)
│
├── hooks/                         # Custom React hooks
│   ├── use-mobile.js
│   ├── useSplashCursor.js
│   └── ... (custom hooks)
│
├── context/                       # React Context providers
│   └── AuthContext.jsx
│
├── services/                      # Business logic & API calls
│   ├── authService.js
│   ├── tenantService.js
│   └── ... (domain services)
│
├── lib/                           # Utilities & helpers
│   ├── api.js                     # API client
│   ├── utils.js                   # General utilities
│   └── constants.js               # App constants
│
├── types/                         # TypeScript type definitions
│   ├── auth.ts
│   ├── tenant.ts
│   └── ... (type definitions)
│
├── styles/                        # Global styles
│   ├── index.css                  # Main stylesheet
│   ├── App.css                    # App-level styles
│   ├── variables.css              # CSS variables & tokens
│   └── tailwind.css               # Tailwind config
│
├── assets/                        # Static assets
│   ├── images/                    # Image files
│   │   └── hero.png
│   ├── icons/                     # Icon files
│   │   ├── react.svg
│   │   └── vite.svg
│   └── fonts/                     # Font files
│
├── store/                         # State management (if using Redux/Zustand)
│   └── ... (store configuration)
│
├── data/                          # Mock data & constants
│   └── mockData.js
│
├── App.jsx                        # Root app component
└── main.jsx                       # Entry point
```

## Folder Guidelines

### 📄 `/pages`
- **Purpose**: Route-level page components
- **When to use**: Components that represent full pages/routes
- **Example**: `LoginPage.jsx`, `TenantListPage.jsx`

### 🎨 `/layout`
- **Purpose**: Layout wrapper components
- **When to use**: Header, sidebar, footer, or layout-level components
- **Example**: `AppHeader.jsx`, `Sidebar.jsx`

### ⚙️ `/features`
- **Purpose**: Feature-specific component groups
- **When to use**: Group related components that work together for a feature
- **Example**: `/chat` for chat-related components, `/agent-detail` for agent details

### 🔧 `/common`
- **Purpose**: Reusable, generic components
- **When to use**: Components used in multiple places
- **Example**: `ExpandableSearch.jsx`, `RichMessage.jsx`

### 🎭 `/ui`
- **Purpose**: Design system components (shadcn/ui, headless UI)
- **When to use**: Low-level UI primitives and design system components
- **Example**: `button.jsx`, `dialog.jsx`, `sidebar.jsx`

### 🪝 `/hooks`
- **Purpose**: Custom React hooks
- **When to use**: Reusable hook logic
- **Example**: `useSplashCursor.js`, custom data fetching hooks

### 📦 `/context`
- **Purpose**: React Context providers
- **When to use**: Global state management (auth, theme, etc.)
- **Example**: `AuthContext.jsx`

### 🔌 `/services`
- **Purpose**: Business logic and API integration
- **When to use**: API calls, data transformation, domain logic
- **Example**: `authService.js`, `tenantService.js`
- **Example usage**:
  ```javascript
  import { fetchUser } from '@/services/authService';
  
  const user = await fetchUser(id);
  ```

### 📚 `/lib`
- **Purpose**: Utility functions and helpers
- **When to use**: General utilities, API client setup, constants
- **Example**: `utils.js`, `constants.js`

### 📋 `/types`
- **Purpose**: TypeScript type definitions
- **When to use**: Shared type definitions (if using TypeScript)
- **Example**: `auth.ts`, `tenant.ts`

### 🎨 `/styles`
- **Purpose**: Global stylesheets
- **When to use**: Global styles, CSS variables, utility classes
- **Note**: Component-scoped styles should stay with components

### 📁 `/assets`
- **Purpose**: Static assets
- **Structure**:
  - `/images` - PNG, JPG, WebP, etc.
  - `/icons` - SVG icons
  - `/fonts` - Web fonts

### 📊 `/data`
- **Purpose**: Mock data and static constants
- **When to use**: Test data, fixture data, lookup tables
- **Example**: `mockData.js`

### 🏪 `/store`
- **Purpose**: State management configuration
- **When to use**: Redux, Zustand, or similar state management setup
- **Example**: Redux store configuration, reducers, actions

## Import Examples

```javascript
// ✅ Good: Using path aliases
import Button from '@/components/ui/button';
import { LoginPage } from '@/components/pages/LoginPage';
import { useAuth } from '@/hooks/useAuth';
import { fetchUsers } from '@/services/userService';
import { formatDate } from '@/lib/utils';

// ❌ Avoid: Relative imports across the tree
import Button from '../../../components/ui/button';
```

## Best Practices

1. **Keep components focused** - Each component should have a single responsibility
2. **Use services for API calls** - Don't fetch data directly in components
3. **Prefer composition** - Build complex UIs from simpler components
4. **Group related components** - Keep feature-related components together in `/features`
5. **Use hooks for logic** - Extract reusable component logic into hooks
6. **Path aliases** - Always use `@/` aliases instead of relative paths
7. **Naming conventions**:
   - React components: PascalCase (`Button.jsx`)
   - Hooks: camelCase with `use` prefix (`useAuth.js`)
   - Utilities: camelCase (`utils.js`)
   - Services: camelCase with `Service` suffix (`userService.js`)

## Migration Checklist

- [x] Created `/pages` directory and moved all page components
- [x] Created `/layout` directory and moved layout components
- [x] Created `/features` directory and organized feature components
- [x] Created `/common` directory and moved reusable components
- [x] Created `/services` directory for business logic
- [x] Created `/styles` directory and moved CSS files
- [x] Created `/types` directory for type definitions
- [x] Created `/assets/{images,icons,fonts}` subdirectories
- [x] Updated all import paths in components
- [x] Updated CSS imports in entry files

---

Generated: 2026-04-16
