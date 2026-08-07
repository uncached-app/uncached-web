# Uncached Launch Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Uncached product and launch website around a sales-oriented early-access experience, with celebratory confirmed cleanup results and no unsupported availability claims.

**Architecture:** Preserve the existing React/Vite/Tauri app and Astro/React website. Update shared product rules and copy first, then refine the website funnel and simulator, then update the desktop completion state. Keep scanner capability claims sourced from the implemented app and keep future Pro work out of current pricing/download CTAs.

**Tech Stack:** React 19, Vite, Tauri 2, Rust backend, Astro 7, Tailwind CSS 4, Motion, TypeScript.

## Global Constraints

- Early access only; no public download or checkout.
- Free tier is the only currently available tier.
- Primary website CTA is `Get early access`.
- Current scanner claims must match implemented scanners.
- Confirmed success may use positive copy, animation, and confetti; failed or cancelled operations remain factual.
- Preserve Quiet Forest Utility palette, Hanken Grotesk, Geist Mono, and existing brand assets.
- Respect reduced-motion preferences and keep website responsive on mobile and desktop.

---

### Task 1: Synchronize Product Rules

**Files:**
- Modify: `E:\projetos-pessoais\uncached\DESIGN.md`
- Modify: `E:\projetos-pessoais\uncached\PRODUCT.md`
- Modify: `E:\projetos-pessoais\uncached-website\docs\DESIGN.md`
- Modify: `E:\projetos-pessoais\uncached-website\docs\PRODUCT.md`
- Modify: `E:\projetos-pessoais\uncached-website\docs\ROADMAP.md`
- Modify: `E:\projetos-pessoais\uncached-website\docs\MONETIZATION_BLUEPRINT.md`

**Interfaces:**
- Produces one shared rule: celebrate confirmed cleanup results in product and marketing surfaces.
- Produces one shared availability state: free-tier private early access, no public download or checkout.

- [ ] Replace the current no-celebration rule with a success-only celebration rule.
- [ ] Document `Get early access` as the website conversion action.
- [ ] Mark Docker, `.NET`, `.venv`, deep IDE cleaners, daemon cleanup, analytics, licensing, and pricing as planned unless implemented.
- [ ] Remove unsupported performance and availability claims from product-facing guidance.
- [ ] Verify terminology and capability lists against `uncached\docs\SCANNERS.md`.

### Task 2: Rebuild Launch Page Funnel

**Files:**
- Modify: `E:\projetos-pessoais\uncached-website\src\pages\index.astro`
- Modify: `E:\projetos-pessoais\uncached-website\src\components\Header.astro`
- Modify: `E:\projetos-pessoais\uncached-website\src\components\FeaturesSection.astro`
- Modify: `E:\projetos-pessoais\uncached-website\src\components\PricingSection.astro`
- Modify: `E:\projetos-pessoais\uncached-website\src\components\FaqSection.astro`
- Modify: `E:\projetos-pessoais\uncached-website\src\components\Footer.astro`
- Modify: `E:\projetos-pessoais\uncached-website\src\styles\global.css`

**Interfaces:**
- Consumes: `WhitelistForm` as early-access capture and `ScanSimulator` as primary product proof.
- Produces: responsive page with `Get early access`, `See Uncached in action`, current scanner list, safety proof, roadmap, and final CTA.

- [ ] Replace hero copy and CTA labels with sales-oriented early-access messaging.
- [ ] Remove current pricing cards and replace them with a future-Pro roadmap block.
- [ ] Reorder sections so hero and simulator lead, followed by trust, workflow, current features, roadmap, FAQ, and final CTA.
- [ ] Remove unsupported claims and celebratory copy that conflicts with the new product rule.
- [ ] Add visible focus states, hover/pressed feedback, and reduced-motion handling.
- [ ] Keep dark forest visual direction while adding stronger hero contrast and result emphasis.

### Task 3: Improve Interactive Demo

**Files:**
- Modify: `E:\projetos-pessoais\uncached-website\src\components\ScanSimulator.tsx`
- Modify: `E:\projetos-pessoais\uncached-website\src\components\WhitelistForm.tsx`

**Interfaces:**
- Consumes: local demo target data and existing `/api/whitelist` endpoint.
- Produces: demo states for scan, target selection, cleanup, and confirmed celebratory result; accessible early-access form states.

- [ ] Mark simulator values as demo data without weakening visual proof.
- [ ] Replace `findings` terminology with `targets`.
- [ ] Keep only implemented target examples in the demo.
- [ ] Add restrained success celebration after simulated cleanup, disabled for reduced motion.
- [ ] Update form labels, loading text, success text, and error text for the early-access funnel.
- [ ] Preserve local duplicate-submission behavior and validate keyboard/focus behavior.

### Task 4: Celebrate Confirmed Desktop Cleanup

**Files:**
- Modify: `E:\projetos-pessoais\uncached\src\components\completion\CompletionView.tsx`
- Modify: `E:\projetos-pessoais\uncached\src\index.css`
- Inspect: `E:\projetos-pessoais\uncached\src\types\*`
- Inspect: `E:\projetos-pessoais\uncached\src\hooks\useScanWorkspace*`

**Interfaces:**
- Consumes: existing `cleanupSummary`, `cleanupMode`, and cleanup status values.
- Produces: success-only celebration using backend-confirmed counts and reclaimed bytes.

- [ ] Read current completion component and summary types before editing.
- [ ] Add positive result hierarchy for reclaimed bytes and processed targets.
- [ ] Add celebration animation using existing dependencies only.
- [ ] Keep cancellation and failure states separate from success.
- [ ] Respect `prefers-reduced-motion`.

### Task 5: Verify and Review

**Files:**
- Inspect all modified files.
- Test: website build and app checks already defined by each repository.

- [ ] Run website `pnpm build` from `uncached-website`.
- [ ] Run app `pnpm exec tsc --noEmit` and `pnpm build` from `uncached`.
- [ ] Run app `cargo fmt --check` and `cargo test` from `uncached\src-tauri`.
- [ ] Run website interaction checks and inspect responsive output if dev server is needed.
- [ ] Search modified docs and UI for stale `Download Free`, pricing, unsupported scanners, `findings`, and no-celebration language.
- [ ] Review `git diff` and report any remaining verification gaps.
