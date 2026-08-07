# Task 1 Brief: Update Header Markup & Add Mobile Hamburger Menu Component

**Plan File:** `docs/superpowers/plans/2026-08-07-cozy-mobile-menu-plan.md`  
**Target File:** `src/components/Header.astro`

## Requirements

1. **Hide Desktop CTA on Mobile:**
   - Change the `Get Uncached` CTA link in `Header.astro` to include `hidden md:inline-flex`.

2. **Add Mobile Hamburger Toggle Button (`md:hidden`):**
   - Add `<button id="mobile-menu-toggle" type="button" aria-label="Toggle Navigation Menu" aria-expanded="false" aria-controls="mobile-menu-dropdown" class="md:hidden p-2.5 rounded-xl bg-surface border border-border-color text-text-primary hover:bg-raised transition-colors focus:outline-none focus:ring-2 focus:ring-accent">`
   - Include 2 SVG icons: `#menu-icon-open` (3 parallel lines, visible by default) and `#menu-icon-close` (X icon, hidden by default).

3. **Add Mobile Dropdown Menu Card (`md:hidden`):**
   - Add `<div id="mobile-menu-dropdown" class="absolute top-full left-6 right-6 mt-2 p-5 bg-surface/95 backdrop-blur-md border border-border-color rounded-2xl shadow-xl transition-all duration-200 opacity-0 pointer-events-none translate-y-[-8px] md:hidden z-50 flex flex-col gap-4">`
   - Include `<nav aria-label="Mobile Navigation" class="flex flex-col gap-2">` with links `Features` (`#features`), `Pricing` (`#pricing`), `Support` (`#faq`).
   - Include horizontal divider `<div class="border-b border-border-color my-0.5"></div>`.
   - Include full-width mobile `Get Uncached` CTA button (`href="#pricing"`).

4. **Script Controller:**
   - Implement toggle logic for opening/closing the dropdown card.
   - Update `aria-expanded` and toggle SVG icon visibility.
   - Close dropdown on navigation link click, outside click, and Escape key press.

5. **Verification:**
   - Run `pnpm build` to verify clean Astro build compilation.
   - Commit with message: `feat: add cozy mobile hamburger menu and hide header CTA on mobile`.
