import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const footer = await readFile(new URL('../src/components/Footer.astro', import.meta.url), 'utf8');

assert.match(
  footer,
  /<div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-secondary font-mono">/,
  'footer navigation links should wrap with independent row spacing on narrow screens',
);
