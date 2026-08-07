# Pre-Launch Website & Whitelist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimalist, quiet pre-launch landing page for Uncached with a Brevo whitelist integration, interactive Motion scan simulator, and Granola/Notion aesthetics.

**Architecture:** Astro 5 page architecture with Tailwind CSS styling, Google Fonts (`Hanken Grotesk` & `Geist Mono`), React/Motion interactive components for the Brevo whitelist form and scan simulator, and an Astro API endpoint (`/api/whitelist`) to handle Brevo contact creation.

**Tech Stack:** Astro, Tailwind CSS, React, `motion`, `pnpm`.

## Global Constraints

- Use `pnpm` for all dependency installations and script commands.
- Adhere strictly to the "Quiet Forest Utility" design system (`#101311` canvas, `#151b17` surfaces, `#b9d98d` Fresh Sage primary accent, `#edf0eb` primary text).
- Responsive mobile and desktop layout up to `max-w-6xl` (72rem).
- Clean Brevo API integration via environment variable `BREVO_API_KEY`.

---

### Task 1: Project Scaffolding & Dependencies

**Files:**
- Modify: `package.json`
- Create: `src/styles/global.css`
- Modify: `astro.config.mjs`

**Interfaces:**
- Produces: CSS design tokens, Hanken Grotesk & Geist Mono font imports, `@astrojs/react` and `motion` dependencies.

- [ ] **Step 1: Install required dependencies via pnpm**

Run: `pnpm add motion @astrojs/react react react-dom @tailwindcss/vite tailwindcss`

- [ ] **Step 2: Update `astro.config.mjs` for React and Tailwind**

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Create global CSS file with design tokens**

Create `src/styles/global.css`:

```css
@import "tailwindcss";

@layer base {
  :root {
    --color-forest-night: #101311;
    --color-forest-surface: #151b17;
    --color-forest-raised: #1a211c;
    --color-forest-border: #222b24;
    --color-fresh-sage: #b9d98d;
    --color-fresh-sage-light: #d1eca9;
    --color-mist-primary: #edf0eb;
    --color-mist-secondary: #c7d0c1;
    --color-mist-muted: #8e998e;
    --color-warning-coral: #ffc2b5;
  }

  body {
    background-color: var(--color-forest-night);
    color: var(--color-mist-primary);
    font-family: 'Hanken Grotesk', sans-serif;
  }

  .font-mono {
    font-family: 'Geist Mono', monospace;
  }
}
```

- [ ] **Step 4: Verify build setup**

Run: `pnpm build`
Expected: Build succeeds without errors.

- [ ] **Step 5: Commit scaffolding**

```bash
git add package.json pnpm-lock.yaml astro.config.mjs src/styles/global.css
git commit -m "chore: setup dependencies, tailwind, react and design tokens"
```

---

### Task 2: Brevo Whitelist API Endpoint

**Files:**
- Create: `src/pages/api/whitelist.ts`
- Create: `.env.example`

**Interfaces:**
- Consumes: JSON `{ email: string, os: string }`
- Produces: JSON response `{ success: boolean, message: string }`

- [ ] **Step 1: Create `.env.example`**

Create `.env.example`:
```env
BREVO_API_KEY=your_brevo_api_key_here
BREVO_LIST_ID=1
```

- [ ] **Step 2: Create API Route `src/pages/api/whitelist.ts`**

```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email, os } = data;

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = import.meta.env.BREVO_API_KEY;

    if (!apiKey) {
      // Mock success for development if key not yet provided
      console.log(`[Dev Whitelist] Received signup: ${email} (${os || 'Unknown OS'})`);
      return new Response(
        JSON.stringify({ success: true, message: 'Added to whitelist (dev mode).' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: email,
        attributes: { OS: os || 'Not specified' },
        updateEnabled: true,
      }),
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      return new Response(
        JSON.stringify({ success: true, message: 'Welcome to the whitelist!' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      const errData = await response.json();
      return new Response(
        JSON.stringify({ success: false, message: errData.message || 'Error subscribing.' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message || 'Server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

- [ ] **Step 3: Test API endpoint**

Run: `pnpm astro check` or verify TypeScript compilation.

- [ ] **Step 4: Commit Brevo API endpoint**

```bash
git add src/pages/api/whitelist.ts .env.example
git commit -m "feat: add brevo whitelist api route"
```

---

### Task 3: Navigation Header Component

**Files:**
- Create: `src/components/Header.astro`

**Interfaces:**
- Consumes: None
- Produces: Astro Header bar with logo and status badge.

- [ ] **Step 1: Create `src/components/Header.astro`**

```astro
---
---

<header class="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
  <div class="flex items-center gap-3">
    <!-- Uncached Icon Logo -->
    <div class="w-8 h-8 rounded-lg bg-[#151b17] border border-[#222b24] flex items-center justify-center text-[#b9d98d] font-bold text-lg shadow-inner">
      U
    </div>
    <span class="font-semibold text-lg tracking-tight text-[#edf0eb]">Uncached</span>
  </div>

  <div class="flex items-center gap-4">
    <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#151b17] border border-[#222b24] text-xs font-mono text-[#c7d0c1]">
      <span class="w-2 h-2 rounded-full bg-[#b9d98d] animate-pulse"></span>
      Whitelist Open
    </div>
    <a
      href="#whitelist"
      class="px-4 py-2 text-xs font-semibold text-[#101311] bg-[#b9d98d] hover:bg-[#d1eca9] rounded-md transition-colors"
    >
      Join Early Access
    </a>
  </div>
</header>
```

- [ ] **Step 2: Commit Header component**

```bash
git add src/components/Header.astro
git commit -m "feat: add header navigation component"
```

---

### Task 4: Interactive Brevo Whitelist Form (React + Motion)

**Files:**
- Create: `src/components/WhitelistForm.tsx`

**Interfaces:**
- Consumes: POST `/api/whitelist`
- Produces: Interactive email form with OS selector pills, loading state, success/error feedback.

- [ ] **Step 1: Create `src/components/WhitelistForm.tsx`**

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function WhitelistForm() {
  const [email, setEmail] = useState('');
  const [os, setOs] = useState('macOS');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, os }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'You have been added to the whitelist!');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to connect to the server.');
    }
  };

  return (
    <div id="whitelist" class="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* OS Selection Pills */}
        <div className="flex items-center justify-center gap-2 mb-1">
          {['macOS', 'Windows', 'Linux'].map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => setOs(platform)}
              className={`px-3 py-1 text-xs font-mono rounded-full border transition-all ${
                os === platform
                  ? 'bg-[#1a211c] text-[#b9d98d] border-[#b9d98d]'
                  : 'bg-[#151b17] text-[#8e998e] border-[#222b24] hover:text-[#c7d0c1]'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>

        {/* Input & Submit Row */}
        <div className="relative flex items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@workspace.dev"
            disabled={status === 'loading' || status === 'success'}
            required
            className="w-full px-4 py-3.5 rounded-xl bg-[#151b17] text-[#edf0eb] placeholder-[#8e998e] border border-[#222b24] focus:outline-none focus:border-[#b9d98d] font-mono text-sm pr-36 transition-all"
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="absolute right-1.5 px-4 py-2.5 bg-[#b9d98d] hover:bg-[#d1eca9] text-[#101311] font-semibold text-xs rounded-lg transition-all disabled:opacity-50"
          >
            {status === 'loading' ? 'Joining...' : status === 'success' ? 'Joined!' : 'Join Whitelist'}
          </button>
        </div>

        {/* Status Message Animation */}
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-xs text-center font-mono ${
                status === 'success' ? 'text-[#b9d98d]' : 'text-[#ffc2b5]'
              }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit WhitelistForm component**

```bash
git add src/components/WhitelistForm.tsx
git commit -m "feat: add interactive brevo whitelist form component"
```

---

### Task 5: Interactive Scan Simulator Component (Motion)

**Files:**
- Create: `src/components/ScanSimulator.tsx`

**Interfaces:**
- Consumes: None
- Produces: Simulated Uncached desktop scanner with animated scanning progress and reclaimable target list.

- [ ] **Step 1: Create `src/components/ScanSimulator.tsx`**

```tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';

const MOCK_TARGETS = [
  { name: 'node_modules', path: '~/projects/web-app/node_modules', size: '8.4 GB', tag: 'Node' },
  { name: 'target/', path: '~/projects/tauri-app/src-tauri/target', size: '4.1 GB', tag: 'Rust' },
  { name: '__pycache__', path: '~/projects/ai-service/.venv', size: '1.7 GB', tag: 'Python' },
  { name: '.gradle', path: '~/projects/mobile-app/android/.gradle', size: '920 MB', tag: 'Gradle' },
];

export default function ScanSimulator() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 1200);
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl bg-[#151b17] border border-[#222b24] p-6 shadow-2xl">
      {/* Top Window Bar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#222b24]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#222b24]"></span>
          <span className="w-3 h-3 rounded-full bg-[#222b24]"></span>
          <span className="w-3 h-3 rounded-full bg-[#222b24]"></span>
          <span className="ml-2 font-mono text-xs text-[#8e998e]">~/projects/workspace</span>
        </div>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="px-3 py-1.5 rounded-md bg-[#1a211c] hover:bg-[#222b24] text-[#b9d98d] font-mono text-xs border border-[#222b24] transition-all"
        >
          {isScanning ? 'Scanning...' : 'Run Scan Demo'}
        </button>
      </div>

      {/* Counter Banner */}
      <div className="flex items-baseline justify-between mb-6 px-4 py-3 rounded-xl bg-[#1a211c] border border-[#222b24]">
        <div>
          <p className="text-xs text-[#8e998e] font-mono">Reclaimable Workspace Space</p>
          <p className="text-2xl font-bold font-mono text-[#b9d98d]">15.12 GB</p>
        </div>
        <span className="text-xs font-mono text-[#c7d0c1] bg-[#151b17] px-2.5 py-1 rounded-md border border-[#222b24]">
          4 targets found
        </span>
      </div>

      {/* Target Items List */}
      <div className="flex flex-col gap-2.5">
        {MOCK_TARGETS.map((item, idx) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0.8, y: 0 }}
            animate={isScanning ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
            transition={{ duration: 0.8, repeat: isScanning ? Infinity : 0, delay: idx * 0.15 }}
            className="flex items-center justify-between p-3 rounded-xl bg-[#101311] border border-[#222b24] hover:border-[#b9d98d]/40 transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1a211c] text-[#b9d98d] border border-[#222b24]">
                {item.tag}
              </span>
              <span className="font-mono text-xs text-[#c7d0c1] truncate">{item.path}</span>
            </div>
            <span className="font-mono text-xs font-semibold text-[#edf0eb] ml-4">{item.size}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit ScanSimulator component**

```bash
git add src/components/ScanSimulator.tsx
git commit -m "feat: add scan simulator interactive component"
```

---

### Task 6: Value Pillars & Pro Teaser Sections

**Files:**
- Create: `src/components/ValuePillars.astro`
- Create: `src/components/ProTeaser.astro`

- [ ] **Step 1: Create `src/components/ValuePillars.astro`**

```astro
---
const pillars = [
  {
    title: "Safety-First Cleanup",
    desc: "Uncached canonicalizes paths and validates targets before execution. Deleted files move safely to system Trash/Recycle Bin.",
    badge: "Trash Integration"
  },
  {
    title: "Broad Developer Scanners",
    desc: "Recognizes bulky disposable targets in Node.js, Rust Cargo, Python virtual environments, Gradle, and .NET.",
    badge: "Smart Detection"
  },
  {
    title: "Quiet Native Speed",
    desc: "Built with Tauri 2 and Rust. Starts instantly, consumes minimal memory, and leaves your CPU free for building software.",
    badge: "Tauri 2 + Rust"
  }
];
---

<section class="w-full max-w-6xl mx-auto px-6 py-20">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {pillars.map((item) => (
      <div class="p-6 rounded-2xl bg-[#151b17] border border-[#222b24] flex flex-col justify-between">
        <div>
          <span class="inline-block mb-3 px-2.5 py-1 rounded-md bg-[#1a211c] text-[#b9d98d] text-xs font-mono border border-[#222b24]">
            {item.badge}
          </span>
          <h3 class="text-lg font-semibold text-[#edf0eb] mb-2">{item.title}</h3>
          <p class="text-sm text-[#c7d0c1] leading-relaxed">{item.desc}</p>
        </div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Create `src/components/ProTeaser.astro`**

```astro
---
---

<section class="w-full max-w-4xl mx-auto px-6 py-12">
  <div class="p-8 rounded-2xl bg-[#151b17] border border-[#222b24] relative overflow-hidden">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <span class="text-xs font-mono text-[#b9d98d] tracking-wider uppercase">Coming in Uncached Pro</span>
        <h3 class="text-2xl font-bold text-[#edf0eb] mt-1 mb-2">Automated Background Purge & Docker Cleaners</h3>
        <p class="text-sm text-[#c7d0c1] max-w-xl">
          Pro unlocks deep IDE build caches (Xcode DerivedData, Android Studio), Docker dangling volumes/images, and background scheduled auto-cleanups.
        </p>
      </div>
      <div class="text-right">
        <span class="text-xs font-mono text-[#8e998e]">Lifetime option available</span>
        <div class="text-xl font-bold font-mono text-[#b9d98d]">$29.90 <span class="text-xs text-[#8e998e]">one-time</span></div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Commit ValuePillars & ProTeaser**

```bash
git add src/components/ValuePillars.astro src/components/ProTeaser.astro
git commit -m "feat: add value pillars and pro teaser sections"
```

---

### Task 7: Main Index Page Assembly & Footer

**Files:**
- Create: `src/components/Footer.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/Footer.astro`**

```astro
---
---

<footer class="w-full border-t border-[#222b24] py-12 mt-20">
  <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
    <div class="flex items-center gap-3">
      <div class="w-6 h-6 rounded bg-[#151b17] border border-[#222b24] flex items-center justify-center text-[#b9d98d] font-bold text-xs">
        U
      </div>
      <span class="text-sm font-semibold text-[#edf0eb]">Uncached</span>
      <span class="text-xs text-[#8e998e] font-mono">© 2026</span>
    </div>

    <p class="text-xs text-[#8e998e] font-mono text-center">
      Quiet Forest Utility — A safer way to reclaim space.
    </p>

    <div class="flex items-center gap-6 text-xs text-[#c7d0c1]">
      <a href="#whitelist" class="hover:text-[#b9d98d] transition-colors">Whitelist</a>
      <a href="https://github.com" target="_blank" class="hover:text-[#b9d98d] transition-colors">GitHub</a>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Modify `src/pages/index.astro`**

```astro
---
import Header from '../components/Header.astro';
import WhitelistForm from '../components/WhitelistForm';
import ScanSimulator from '../components/ScanSimulator';
import ValuePillars from '../components/ValuePillars.astro';
import ProTeaser from '../components/ProTeaser.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width" />
    <meta name="generator" content={Astro.generator} />
    <title>Uncached — A Calmer Way to Reclaim Space</title>
    <meta name="description" content="Uncached finds disposable build artifacts in developer workspaces and safely reclaims disk space." />
    
    <!-- Google Fonts: Hanken Grotesk & Geist Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body class="min-h-screen flex flex-col bg-[#101311] text-[#edf0eb] selection:bg-[#b9d98d] selection:text-[#101311]">
    <Header />

    <main class="flex-1">
      {/* Hero Section */}
      <section class="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 class="text-4xl md:text-6xl font-bold tracking-tight text-[#edf0eb] mb-6 leading-tight">
          A calmer way to reclaim space from developer workspaces.
        </h1>
        <p class="text-lg md:text-xl text-[#c7d0c1] max-w-2xl mx-auto mb-10 leading-relaxed">
          Uncached safely detects disposable artifacts like <code class="font-mono text-sm text-[#b9d98d] bg-[#151b17] px-1.5 py-0.5 rounded border border-[#222b24]">node_modules</code>, Rust <code class="font-mono text-sm text-[#b9d98d] bg-[#151b17] px-1.5 py-0.5 rounded border border-[#222b24]">target/</code>, and Python caches, moving them gently to your system Trash.
        </p>

        {/* Brevo Whitelist Component */}
        <WhitelistForm client:load />
      </section>

      {/* Simulator Section */}
      <section class="px-6 py-8">
        <ScanSimulator client:load />
      </section>

      {/* Value Pillars */}
      <ValuePillars />

      {/* Pro Teaser */}
      <ProTeaser />
    </main>

    <Footer />
  </body>
</html>
```

- [ ] **Step 3: Commit main page assembly**

```bash
git add src/components/Footer.astro src/pages/index.astro
git commit -m "feat: assemble main index landing page"
```

---

### Task 8: Verification & Production Build

- [ ] **Step 1: Run production build check**

Run: `pnpm build`
Expected: Output in `dist/` created successfully without errors.

- [ ] **Step 2: Commit final build confirmation**

```bash
git commit --allow-empty -m "chore: verify production build"
```
