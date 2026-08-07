# Design Specification: Uncached Pre-Launch Landing Page & Whitelist

- **Date**: 2026-08-06
- **Status**: Approved
- **Topic**: Pre-Launch Landing Page with Brevo Whitelist Integration

---

## 1. Product & Creative Direction

### Concept: "Quiet Forest Utility"
The landing page for Uncached embodies a calm, grounded, typography-driven aesthetic inspired by tools like Granola.so, Notion, and Bear.app. It communicates safety, responsiveness, and speed without visual noise or flashy hype.

### Color Tokens & Palette
- **Forest Night (`#101311`)**: Main canvas background.
- **Forest Surface (`#151b17`)**: Cards, inputs, and container surfaces.
- **Forest Raised (`#1a211c`)**: Hover states and interactive elements.
- **Forest Border (`#222b24`)**: Subtle borders and divider lines.
- **Fresh Sage (`#b9d98d`)**: Primary CTA buttons, focus rings, and selection indicators.
- **Fresh Sage Light (`#d1eca9`)**: Hover emphasis for affirmative actions.
- **Mist Primary (`#edf0eb`)**: High-contrast headlines and body text.
- **Mist Secondary (`#c7d0c1`)**: Subtitles and secondary metadata.
- **Mist Muted (`#8e998e`)**: Labels, placeholders, and quiet hints.
- **Warning Coral (`#ffc2b5`)**: Destructive or warning indicators.

### Typography
- **Primary / Humanist**: Hanken Grotesk (Google Fonts) for display headlines, titles, and body prose.
- **Monospace**: Geist Mono for filesystem paths, size counters, scanner categories, and technical metadata.

---

## 2. Page Architecture & Section Layout

1. **Header & Navigation Bar**:
   - Uncached Logo asset (`public/brand/` or SVG vector).
   - Status badge: `● Whitelist Open`.
   - Direct anchor scroll button to Whitelist registration.

2. **Hero Section**:
   - **Headline**: *"A calmer way to reclaim space from developer workspaces."*
   - **Subtitle**: *"Uncached safely detects disposable artifacts like `node_modules`, Rust `target/`, Docker caches, and `.venv`, moving them gently to your system Trash."*
   - **Whitelist Form**:
     - Email input field with monospace placeholder.
     - Platform selector pills: `macOS`, `Windows`, `Linux`.
     - Primary button (Fresh Sage): *"Join Whitelist"*.
     - Feedback state: Toast notification or inline confirmation upon submission via Brevo API.

3. **Interactive Scan Simulator (Powered by Motion)**:
   - Interactive dark forest terminal/card widget.
   - Live interactive scan toggle button showing workspace path `~/projects/workspace`.
   - Animated counter calculating reclaimable space (e.g. `14.2 GB Reclaimable`).
   - Monospace list cards displaying discovered target items (`node_modules`, `target/`, `.venv`, `.gradle`).

4. **Product Value Pillars Grid**:
   - **Safety First**: Moves files strictly to native system Trash/Recycle Bin with backend scope validation.
   - **Broad Ecosystem Scanners**: Built-in support for JS/TS, Rust, Python, Java/Gradle, .NET, and Docker.
   - **Native Speed**: Built with Tauri 2 and Rust for instant launch and minimal RAM footprint.

5. **Uncached Pro Feature Teaser**:
   - Understated comparison matrix between Starter ($0) and Pro ($4.90/mo or $29.90 lifetime).
   - Highlighted Pro capabilities: Docker & Container cleaner, Deep IDE caches (Xcode, Android Studio), Background Auto-Purge daemon.

6. **Footer & Secondary CTA**:
   - Secondary Brevo whitelist email signup box.
   - Copyright notice, social links, and link to docs.

---

## 3. Technology Stack & Integrations

- **Framework**: Astro 5 (`astro`).
- **Styling**: Tailwind CSS + Vanilla CSS Tokens based on `docs/DESIGN.md`.
- **Motion**: `motion` (`pnpm add motion` / `motion/react`) for calm animations.
- **Package Manager**: `pnpm` (configured in `.agent/AGENTS.md`).
- **Whitelist API**: Astro API Endpoint (`/src/pages/api/whitelist.ts`) forwarding submitted emails and OS preferences to the Brevo API (`https://api.brevo.com/v3/contacts`).
