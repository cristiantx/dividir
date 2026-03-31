# Premium Obsidian Design System

### 1. Overview & Creative North Star
**Creative North Star: "The Financial Brutalist"**
Premium Obsidian is a high-contrast, editorial-inspired design system that treats financial data with the gravitas of a luxury fashion lookbook. It moves away from the "friendly fintech" aesthetic of soft blues and rounded corners toward a sharp, tech-noir environment. The system prioritizes pure black backgrounds (`#000000`) and high-performance accents.

The system breaks standard templates through:
- **Intentional Asymmetry:** Horizontal scrolling carousels paired with vertical feeds.
- **Monospaced Precision:** Using `JetBrains Mono` for all data points to emphasize accuracy and "code-like" efficiency.
- **Aggressive Typography:** Over-scaled display values contrasted with tiny, wide-tracked labels.

### 2. Colors
The palette is rooted in an "Obsidian" base with high-chroma signals for status and action.

- **Primary & Action:** The "Electric Lime" (`#D4FF00`) is the sole driver for high-priority actions.
- **Status Signals:** Secondary (`#00FF9D`) for positive growth and Tertiary (`#FF3366`) for negative balance.
- **The "No-Line" Rule:** Sectioning is achieved through color shifts from `#000000` (Background) to `#121212` (Surface). Avoid 1px borders unless using the `outline-variant` at 50% opacity for subtle container definitions.
- **Surface Hierarchy:** 
  - **Level 0 (Base):** `#000000` (Main backgrounds).
  - **Level 1 (Nesting):** `#121212` (Cards and list items).
  - **Level 2 (Interaction):** `#1A1A1A` (Hover states).
- **Glass & Glow:** Use `shadow-surface-glow` (inset top white glow at 5% opacity) to give cards a machined, physical edge.

### 3. Typography
The system uses a triple-font strategy to define hierarchy:
- **Display (Space Grotesk):** Geometric and bold. Used for section headers and titles.
- **Body (Satoshi/Inter):** Clean sans-serif for readability in meta-data and descriptions.
- **Mono (JetBrains Mono):** The "Source of Truth" font. Every currency and numerical value must be in Mono.

**Typography Scale (Ground Truth):**
- **Hero Balance:** `40px` JetBrains Mono, Bold.
- **Section Headers:** `13px` Space Grotesk, Semi-bold, Tracking 0.1em (Uppercase).
- **List Titles:** `15px` Space Grotesk, Semi-bold.
- **Meta/Labels:** `11px` JetBrains Mono or `13px` Satoshi.

### 4. Elevation & Depth
Depth is created through light simulation rather than shadow. 
- **The Layering Principle:** Content sits on "slabs" of Surface (`#121212`) over the deep Black background.
- **Ambient Shadows:** Standard shadows are rarely used; instead, use the `shadow-lg` for floating action buttons.
- **Internal Glow:** Cards utilize an `inset 0 1px 0 rgba(255,255,255,0.05)` to simulate a beveled top edge, giving a "premium hardware" feel.
- **Ghost Borders:** If a boundary is required for clarity, use `#222222` (Border-color).

### 5. Components
- **Buttons:** 
  - **FAB:** Circular, `#D4FF00` background, black icon.
  - **Tertiary:** Text-only, muted gray with hover transition to white.
- **Cards (Group Cards):** Fixed-width (`140px`), `8px` radius, `#121212` background. Features a circular icon housing at the top and a mono-spaced balance at the bottom.
- **Activity Feed:** Borderless rows separated by `0.5px` border-color/50. Hover state transitions to Surface-container.
- **Bottom Navigation:** Fixed, pure black, with high-contrast active states in Primary lime.

### 6. Do's and Don'ts
**Do:**
- Use pure black (`#000`) for the main body background to maximize OLED contrast.
- Use `JetBrains Mono` for any text that includes a number.
- Apply `uppercase` and `letter-spacing` to all category labels.

**Don't:**
- Use standard "Blue" for links; use Electric Lime or White.
- Use heavy drop shadows on cards; rely on the `surface-glow` inset instead.
- Use soft, organic shapes; stick to `8px` (Standard) or `full` (Pill/Circle) radii.
- Mix the semantic meaning of colors (Green always means positive balance, never just "go").