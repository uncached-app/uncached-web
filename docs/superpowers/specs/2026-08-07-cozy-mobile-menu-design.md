# Design Spec: Mobile Hamburger Menu & Header Mobile CTA Adjustments

**Date:** 2026-08-07  
**Status:** Approved  
**Compliance:** `docs/DESIGN.md` (Quiet Forest Utility, spec-terse voice, theme tokens) & `docs/PRODUCT.md`

## Overview

Enhance the mobile user experience for Uncached by introducing a cozy, responsive hamburger menu card on small screens (`< md`) and hiding the top bar "Get Uncached" CTA button on mobile, placing it inside the mobile navigation card instead.

## Goals & Intent

1. **Clean Mobile Top Bar:** Remove visual clutter on small viewports by hiding the `Get Uncached` button from the main header bar on mobile screens.
2. **Cozy Mobile Navigation:** Provide a responsive dropdown menu card with smooth glassmorphism styling (`bg-surface/95 backdrop-blur-md border border-border-color rounded-2xl`).
3. **Spec-Terse & Theme Compliant:** Follow all design tokens from `DESIGN.md` across Light and Dark themes, using Hanken Grotesk for copy and maintaining accessibility (`aria-expanded`, `aria-label`, focus management).

## Functional Requirements

### Header Adjustments (`Header.astro`)

- **Top Bar Desktop CTA:**
  - Wrap the `Get Uncached` header button with `hidden md:inline-flex` so it only displays on viewports `md` (768px) and larger.
- **Mobile Menu Toggle Button (`md:hidden`):**
  - Render a button on mobile with `id="mobile-menu-toggle"` and `aria-expanded="false"`.
  - Icon swaps cleanly between a 3-line hamburger SVG icon (`#menu-icon-open`) and a close 'X' SVG icon (`#menu-icon-close`).
  - Styled with `p-2.5 rounded-xl bg-surface border border-border-color text-text-primary hover:bg-raised transition-colors`.

### Mobile Menu Dropdown Card (`md:hidden`)

- **Container:**
  - `id="mobile-menu-dropdown"`
  - Absolute positioning below the header: `absolute top-full left-6 right-6 mt-2 p-5 bg-surface/95 backdrop-blur-md border border-border-color rounded-2xl shadow-xl transition-all duration-200 opacity-0 pointer-events-none translate-y-[-8px]`.
  - Opened state: `opacity-100 pointer-events-auto translate-y-0`.
- **Navigation Links:**
  - `<nav aria-label="Mobile Navigation" class="flex flex-col gap-3">`
  - Links: `Features` (`#features`), `Pricing` (`#pricing`), `Support` (`#faq`).
  - Font styling: Hanken Grotesk (`font-medium text-text-secondary hover:text-accent transition-colors py-2 px-1 text-base`).
  - Clicking any link automatically closes the mobile dropdown menu card.
- **Divider & CTA:**
  - Horizontal divider: `border-b border-border-color my-1`.
  - Mobile CTA: `a` element with `href="#pricing"`, `class="w-full text-center py-3 text-sm font-semibold text-accent-text bg-accent hover:bg-accent-hover rounded-xl transition-colors shadow-sm display-block"`.

## Interactivity & Script (`Header.astro` `<script>`)

- Toggle logic handling clicks on `#mobile-menu-toggle`.
- Closing menu on outside click or Esc key press.
- Closing menu upon clicking any nav item inside `#mobile-menu-dropdown`.
- Accessible key handling.

## Verification & Testing

- Test on mobile viewports (< 768px) and desktop viewports (>= 768px).
- Verify dark/light theme switching maintains exact color compliance.
- Confirm keyboard accessibility and focus navigation.
