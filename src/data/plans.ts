/**
 * Kept in step with `PRO_FEATURES` in the desktop app's `LicenseSection.tsx`,
 * which is what actually unlocks. A capability listed here and not gated there
 * is a promise the product does not keep.
 */
export const proFeatures = [
  'Scheduled maintenance, and a run when the disk runs low',
  'Projects you keep out of maintenance',
  'Machine-wide caches: package managers, AI tools, editors',
  'Every unused toolchain version, with its uninstall command',
  'Up to 12 workspace folders at once',
  'Every duplicate dependency, with the projects holding it',
  'Reclaim history, insights and a weekly summary',
  'Six app icons for the Dock',
] as const;

export const freeFeatures = [
  'Every artifact of every project, with no limits',
  'Confidence readings and verdicts before anything moves',
  'The check that runs again at removal, not only at scan',
  'Trash by default',
  'Secrets Git would publish: env files, keys, credentials',
  'Unused dependencies, with the command that removes them',
  'Repository size, and when git gc would shrink it',
  'Free and reclaimable space in the menu bar',
] as const;

export interface ProPrice {
  readonly id: 'annual' | 'lifetime';
  readonly price: string;
  readonly cadence: string;
  readonly note: string;
  readonly cta: string;
  readonly priceId?: string;
  readonly featured?: boolean;
}

export const proPrices: readonly ProPrice[] = [
  {
    id: 'annual',
    price: '$4.99',
    cadence: 'a year',
    note: 'A fresh key arrives by email on every renewal.',
    cta: 'Buy annual',
    priceId: import.meta.env.PUBLIC_PADDLE_PRICE_ANNUAL,
  },
  {
    id: 'lifetime',
    price: '$14.99',
    cadence: 'once',
    note: 'The key never expires.',
    cta: 'Buy lifetime',
    priceId: import.meta.env.PUBLIC_PADDLE_PRICE_LIFETIME,
    featured: true,
  },
];
