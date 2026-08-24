export interface Plan {
  readonly id: 'free' | 'annual' | 'lifetime';
  readonly name: string;
  readonly price: string;
  readonly cadence: string;
  readonly summary: string;
  readonly cta: string;
  readonly features: readonly string[];
  /** Paddle price ID. Absent on the free tier, which never opens a checkout. */
  readonly priceId?: string;
  readonly featured?: boolean;
}

const FREE_FEATURES = [
  'Standard target scans — node_modules, Cargo target/, .gradle/',
  'Manual one-click cleanup with sizes shown before anything moves',
  'Trash or Recycle Bin by default, so cleanup stays reversible',
] as const;

const PRO_FEATURES = [
  'Everything in Free',
  'Docker cleaner — dangling images, build cache, unused volumes',
  'Deep IDE caches — Xcode DerivedData, Android Studio, Next.js, Turbo, Pytest',
  'Background auto-purge on a schedule you set',
  'Multi-drive parallel scanner for external SSDs and NAS volumes',
  'Reclaim analytics — history and breakdown per ecosystem',
] as const;

export const plans: readonly Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    summary: 'The local scanner, with the safety rails that never move behind a paywall.',
    cta: 'Download free',
    features: FREE_FEATURES,
  },
  {
    id: 'annual',
    name: 'Pro Annual',
    price: '$19.90',
    cadence: 'per year',
    summary: 'About $1.66 a month. A fresh licence key is emailed on every renewal.',
    cta: 'Buy annual',
    features: PRO_FEATURES,
    priceId: import.meta.env.PUBLIC_PADDLE_PRICE_ANNUAL,
  },
  {
    id: 'lifetime',
    name: 'Pro Lifetime',
    price: '$89.90',
    cadence: 'once',
    summary: 'Pay once. The key never expires, and neither does the offline activation.',
    cta: 'Buy lifetime',
    features: PRO_FEATURES,
    priceId: import.meta.env.PUBLIC_PADDLE_PRICE_LIFETIME,
    featured: true,
  },
];
