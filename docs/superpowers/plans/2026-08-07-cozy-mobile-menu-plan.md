# Cozy Mobile Hamburger Menu & Mobile CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove top-bar "Get Uncached" button on mobile screens and add a cozy glassmorphism mobile hamburger menu in `Header.astro`.

**Architecture:** Update `Header.astro` with responsive visibility (`hidden md:inline-flex` on desktop CTA, `md:hidden` on hamburger button & menu overlay), dynamic SVG icon toggling, accessible keyboard/click event handling, and styling aligned with `docs/DESIGN.md`.

**Tech Stack:** Astro, HTML5, Vanilla JavaScript, TailwindCSS, Hanken Grotesk.

## Global Constraints

- **Design System:** `docs/DESIGN.md` Quiet Forest Utility tokens (`bg-surface`, `border-border-color`, `text-text-primary`, `bg-accent`, `text-accent-text`).
- **Voice:** spec-terse navigation links (`Features`, `Pricing`, `Support`, `Get Uncached`).
- **Package Manager:** `pnpm`.

---

### Task 1: Update Header Markup & Add Mobile Hamburger Menu Component

**Files:**
- Modify: `src/components/Header.astro`

**Interfaces:**
- Consumes: Header navigation items and theme attributes.
- Produces: Responsive mobile hamburger toggle button (`#mobile-menu-toggle`) and dropdown container (`#mobile-menu-dropdown`).

- [ ] **Step 1: Inspect `Header.astro` content**

Ensure we have the current file structure in mind:
```astro
<header class="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between"> ... </header>
```

- [ ] **Step 2: Update `Header.astro` markup**

Replace the contents of `src/components/Header.astro` with updated markup including the mobile toggle button and floating glass dropdown menu:

```astro
---
---

<header class="relative w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-50">
  <a href="/" class="flex items-center gap-3 group">
    <!-- Uncached Logo swapping dynamically per theme -->
    <img 
      id="uncached-header-logo"
      src="/brand/UNCACHED-LOGO-DARK-NOBG.svg" 
      alt="Uncached Logo" 
      class="h-5 w-auto object-contain transition-opacity group-hover:opacity-90"
    />
  </a>

  <!-- Desktop Navigation Links -->
  <nav aria-label="Main Navigation" class="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
    <a href="#features" class="hover:text-accent transition-colors">Features</a>
    <a href="#pricing" class="hover:text-accent transition-colors">Pricing</a>
    <a href="#faq" class="hover:text-accent transition-colors">Support</a>
  </nav>

  <!-- Right Actions Container -->
  <div class="flex items-center gap-3 sm:gap-4">
    <!-- Desktop-Only CTA Button -->
    <a
      href="#pricing"
      class="hidden md:inline-flex px-4 py-2 text-xs font-semibold text-accent-text bg-accent hover:bg-accent-hover rounded-xl transition-colors shadow-sm"
    >
      Get Uncached
    </a>

    <!-- Mobile Hamburger Toggle Button -->
    <button
      id="mobile-menu-toggle"
      type="button"
      aria-label="Toggle Navigation Menu"
      aria-expanded="false"
      aria-controls="mobile-menu-dropdown"
      class="md:hidden p-2.5 rounded-xl bg-surface border border-border-color text-text-primary hover:bg-raised transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <!-- Open Hamburger Icon -->
      <svg id="menu-icon-open" class="w-5 h-5 block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <!-- Close X Icon -->
      <svg id="menu-icon-close" class="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Mobile Floating Dropdown Card -->
  <div
    id="mobile-menu-dropdown"
    class="absolute top-full left-6 right-6 mt-2 p-5 bg-surface/95 backdrop-blur-md border border-border-color rounded-2xl shadow-xl transition-all duration-200 opacity-0 pointer-events-none translate-y-[-8px] md:hidden z-50 flex flex-col gap-4"
  >
    <nav aria-label="Mobile Navigation" class="flex flex-col gap-2">
      <a href="#features" class="mobile-nav-link py-2 px-3 text-base font-medium text-text-secondary hover:text-accent hover:bg-raised/50 rounded-lg transition-colors">
        Features
      </a>
      <a href="#pricing" class="mobile-nav-link py-2 px-3 text-base font-medium text-text-secondary hover:text-accent hover:bg-raised/50 rounded-lg transition-colors">
        Pricing
      </a>
      <a href="#faq" class="mobile-nav-link py-2 px-3 text-base font-medium text-text-secondary hover:text-accent hover:bg-raised/50 rounded-lg transition-colors">
        Support
      </a>
    </nav>

    <div class="border-b border-border-color my-0.5"></div>

    <a
      href="#pricing"
      class="mobile-nav-link w-full text-center py-3 text-sm font-semibold text-accent-text bg-accent hover:bg-accent-hover rounded-xl transition-colors shadow-sm block"
    >
      Get Uncached
    </a>
  </div>
</header>

<script>
  function updateHeaderLogo(theme: string) {
    const logoImg = document.getElementById('uncached-header-logo') as HTMLImageElement | null;
    if (logoImg) {
      logoImg.src = theme === 'light' 
        ? '/brand/UNCACHED-LOGO-DARK-NOBG.svg' 
        : '/brand/UNCACHED-LOGO-LIGHT-NOBG.svg';
    }
  }

  // Initial Sync
  const initialTheme = document.documentElement.dataset.theme || 'light';
  updateHeaderLogo(initialTheme);

  // Listen to Theme Toggle events
  window.addEventListener('theme-change', (e: Event) => {
    const customEvent = e as CustomEvent<{ theme: string }>;
    updateHeaderLogo(customEvent.detail.theme);
  });

  // Mobile Menu Controller
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const dropdown = document.getElementById('mobile-menu-dropdown');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  let isMenuOpen = false;

  function setMenuState(open: boolean) {
    isMenuOpen = open;
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(open));
    }
    if (dropdown) {
      if (open) {
        dropdown.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-8px]');
        dropdown.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        dropdown.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
        dropdown.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-8px]');
      }
    }
    if (iconOpen && iconClose) {
      if (open) {
        iconOpen.classList.replace('block', 'hidden');
        iconClose.classList.replace('hidden', 'block');
      } else {
        iconClose.classList.replace('block', 'hidden');
        iconOpen.classList.replace('hidden', 'block');
      }
    }
  }

  toggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenuState(!isMenuOpen);
  });

  // Close when clicking nav links
  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setMenuState(false);
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isMenuOpen && dropdown && toggleBtn && !dropdown.contains(e.target as Node) && !toggleBtn.contains(e.target as Node)) {
      setMenuState(false);
    }
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
      setMenuState(false);
    }
  });
</script>
```

- [ ] **Step 3: Run astro build to verify code compilation**

Run: `pnpm build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit changes**

```powershell
git add src/components/Header.astro
git commit -m "feat: add cozy mobile hamburger menu and hide header CTA on mobile"
```
