# Pulse Feature — UI Generation Module

## Overview

**Pulse** is a dedicated module for rapid AI-powered UI generation and iteration. It delivers an immersive, visual-first experience designed to eliminate friction between ideation and execution.

**Core Positioning:** "From AI conversation to AI execution"

---

## Feature Architecture

### 1. **Pulse Entry Point**
- **Location:** Side Navigation (Primary menu item)
- **Icon:** `BarChart3` (Lucide)
- **Route:** `/pulse`
- **Sidebar Integration:** Already configured in `Sidebar.jsx`

### 2. **Pulse Dashboard (List View)**

**Purpose:** Centralized hub for all generated UI artifacts

**Location:** `src/components/features/pulse/PulseDashboard.jsx`

**Layout:**
- Responsive card grid (1 col mobile → 3 cols desktop)
- Each card displays:
  - Title (from original prompt)
  - Preview thumbnail
  - Last edited timestamp
  - Action buttons (Edit, Duplicate, Delete) on hover

**Header:**
- Page title: "Pulse"
- Subtitle: "Generate, iterate, and manage UI designs with AI"
- Primary CTA: "Create New" button

**Empty State:**
- Friendly messaging
- Direct call-to-action to create first UI

**State Management:**
- Artifacts stored in `PulsePage` component state
- Sample data included for demonstration

---

### 3. **Create Flow (Split-Screen Editor)**

**Purpose:** Core UI generation experience

**Location:** `src/components/features/pulse/PulseCreateFlow.jsx`

**Layout: 35% / 65% Split**

#### **Left Panel (35%) — Prompt Interface**

**Components:**
- **UI Title Input** - Editable field for naming the artifact
- **Large Textarea** - Natural language prompt input
- **Mobile-First Toggle** - Optimization checkbox
- **Generate Button** - Triggers UI generation

**Features:**
- Contextual placeholder text
- Real-time input validation
- Disabled state during generation

#### **Right Panel (65%) — Live Preview**

**Components:**
- **Header Bar** - Shows generation status
- **Interactive Canvas** - Displays generated HTML via iframe
- **Empty State** - Prompts user to generate

**Features:**
- Real-time iframe rendering
- Sandboxed execution (`sandbox="allow-scripts"`)
- Responsive preview
- Light/dark mode support

**Header:**
- Back button (returns to dashboard)
- Status indicator
- Save UI button (enabled when content exists)

---

## Component Structure

```
src/components/features/pulse/
├── PulseDashboard.jsx      # List view of all artifacts
└── PulseCreateFlow.jsx     # Split-screen editor

src/components/pages/
└── PulsePage.jsx           # Main router component
```

### Data Structure

```javascript
{
  id: number,                    // Unique identifier
  title: string,                 // Artifact name
  prompt: string,                // Original user prompt
  html: string,                  // Generated HTML content
  isMobileFirst: boolean,        // Optimization flag
  thumbnail: string | null,      // Preview image URL
  lastEdited: Date,              // Timestamp
}
```

---

## Navigation & Routing

**Dashboard to Create:**
```
PulsePage (view: "dashboard")
  ↓ user clicks "Create New"
PulsePage (view: "create")
```

**Create to Dashboard (Save):**
```
PulseCreateFlow.onSave()
  ↓ saves artifact
PulsePage (view: "dashboard")
  ↓ displays in grid
```

**Create to Dashboard (Back):**
```
PulseCreateFlow.onBack()
  ↓ discards unsaved changes
PulsePage (view: "dashboard")
```

---

## User Workflows

### **Create New UI**
1. User clicks "Pulse" in sidebar → Dashboard
2. Clicks "Create New"
3. Enters descriptive prompt: *"Create a modern SaaS dashboard..."*
4. (Optional) Toggles mobile-first optimization
5. Clicks "Generate UI"
6. Watches real-time preview render
7. Iterates by editing prompt
8. Clicks "Save UI" → returns to dashboard
9. New UI appears in grid as latest artifact

### **Edit Existing UI**
1. Dashboard displays card grid
2. User hovers over a card
3. Clicks "Edit" action
4. Editor loads with original prompt
5. User modifies prompt
6. Clicks "Generate UI" to regenerate
7. Iterates and refines
8. Clicks "Save UI" → updates artifact

### **Duplicate UI**
1. User hovers over a card
2. Clicks "Duplicate"
3. New card created with "(Copy)" suffix
4. Can immediately edit the duplicate

### **Delete UI**
1. User hovers over a card
2. Clicks delete (trash icon)
3. Artifact removed from dashboard

---

## Design Principles

### **Instantaneity**
- Generate → preview in seconds
- No page reloads or delays
- Immediate visual feedback

### **Visual Primacy**
- Output is the product, not supporting text
- Large preview area (65% of screen)
- Interactive iframe—users see actual rendering

### **Iterability**
- Prompt editing triggers regeneration
- No "back and forth"—seamless refinement
- Save only when satisfied

---

## Styling & Theming

**Colors & Tokens:**
- Primary action: `blue-600` / `blue-700`
- Card backgrounds: `white` / `slate-900` (dark)
- Borders: `slate-200` / `slate-800` (dark)
- Text: `foreground` / `muted-foreground`

**Component Library:**
- Button: `@/components/ui/button`
- Icons: Lucide React (already used)
- Responsive: Tailwind grid system

---

## Future Enhancements (Phase 2+)

### **Immediate Wins**
- [ ] Export to React component
- [ ] Export to Figma design
- [ ] Version history tracking
- [ ] Drag-and-drop component editing in preview
- [ ] Style presets (Minimal, Dark, Enterprise)

### **Advanced**
- [ ] Component reuse library
- [ ] Multi-page support
- [ ] Template system
- [ ] Collaboration & sharing
- [ ] API integration showcase
- [ ] Code syntax highlighting

### **AI Integration**
- [ ] Hook to Claude API for actual generation
- [ ] Fine-tuning prompts with examples
- [ ] Design system constraints
- [ ] Accessibility checking

---

## Implementation Notes

### **Current Limitations**
- Mock data in component state (demo only)
- Static HTML generation (placeholder)
- No persistence layer
- No backend integration

### **Production Readiness Checklist**
- [ ] Connect to Claude API
- [ ] Implement database persistence
- [ ] Add user authentication (artifact ownership)
- [ ] Error handling & validation
- [ ] Performance optimization (lazy loading)
- [ ] Analytics tracking
- [ ] Export functionality
- [ ] Rate limiting

---

## Testing Checklist

- [x] Dashboard renders card grid
- [x] Create New button navigates to editor
- [x] Prompt input accepts text
- [x] Generate button triggers preview
- [x] Preview renders via iframe
- [x] Save button returns to dashboard
- [x] Back button returns without saving
- [x] Edit loads existing artifact data
- [x] Duplicate creates copy with new ID
- [x] Delete removes from grid
- [x] Build passes without errors

---

## Files Created/Modified

**New Files:**
- `src/components/features/pulse/PulseDashboard.jsx`
- `src/components/features/pulse/PulseCreateFlow.jsx`

**Modified Files:**
- `src/components/pages/PulsePage.jsx` (complete rewrite)

**Unchanged:**
- Sidebar navigation (Pulse already configured)
- App.jsx routing (uses existing "pulse" route)

---

## Quick Start

### **Run the app:**
```bash
npm run dev
```

### **Navigate to Pulse:**
1. Click "Pulse" in sidebar
2. Click "Create New"
3. Enter a prompt
4. Click "Generate UI"
5. See live preview
6. Click "Save UI"

### **Development Tips:**
- Edit prompt in left panel to test live updates
- Mock generation uses `setTimeout(1500ms)`
- Replace with actual Claude API call in production
- iFrame sandbox prevents XSS but limits interactivity

---

## Product Value Recap

**Who Benefits:**
- **Designers:** Rapid concept exploration & validation
- **Developers:** Instant scaffolding for build-ready components
- **Product Teams:** Faster validation cycles & stakeholder alignment

**Core Promise:**
*Generate production-ready UI prototypes from natural language—instantly.*

---

**Status:** ✅ Complete & Functional  
**Last Updated:** 2026-04-16  
**Build:** ✓ Passing
