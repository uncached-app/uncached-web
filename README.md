<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand-kit/logo-on-dark.svg" />
    <img src="brand-kit/logo-on-light.svg" alt="Uncached" width="340" />
  </picture>
</p>

<p align="center"><strong>The website at <a href="https://uncached.app">uncached.app</a>.</strong></p>

Astro 7 on Cloudflare Workers, with React islands and Tailwind 4. The pages are
static; three API routes run on the Worker:

| Route | What it does |
| :--- | :--- |
| `/api/latest` | The latest release, read from the update manifest, for the download page |
| `/api/license` | Paddle webhook: issues and emails the signed licence key |
| `/api/whitelist` | Adds an email to the Brevo list (the Windows waitlist) |

The homepage demo renders the desktop app's own components against sample
data. They are copied from `../uncached-desktop/src` into `src/demo/app` by
`scripts/sync-demo.mjs`, because this repository builds without the desktop
sources; Tauri and `canvas-confetti` are replaced by stubs through Vite aliases.

## Commands

```bash
pnpm install
pnpm dev                                # astro dev on localhost:4321
pnpm build                              # production build into dist/
pnpm run deploy                         # build and wrangler deploy (plain `pnpm deploy` is pnpm's own command)
node scripts/sync-demo.mjs              # recopy the desktop components for the demo
node scripts/generate-brand-kit.mjs     # banners, avatars and logos into brand-kit/
node scripts/generate-og.mjs            # public/og-image.png
node --env-file=.env scripts/send-launch-email.mjs   # waitlist email, see the script header
```

Stop the dev server before `pnpm build`: both write Vite's dependency cache, and
a build under a running dev server leaves it serving an error page.

## Configuration

`.env.example` lists every variable. Two kinds, set in different places on
Cloudflare:

- **Build variables** (Workers → Settings → Build): everything prefixed
  `PUBLIC_`. They are inlined into the pages at build time, so the checkout gate
  `PUBLIC_CHECKOUT_ENABLED=true`, the Paddle client token and the price IDs only
  take effect on the next build.
- **Runtime secrets and variables**: the Brevo API key, the Paddle webhook secret
  and API key, and `LICENSE_SIGNING_SEED`. Non-secret runtime values live in
  `wrangler.jsonc`.

Pushing to `master` deploys.

## License

Proprietary.
