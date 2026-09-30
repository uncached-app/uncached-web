/**
 * Generates public/og-image.png (1200x630) for social link previews.
 *
 * Run manually after changing brand colors or the tagline:
 *   npm run og
 *
 * This is deliberately NOT part of `npm run build`. The site is a single page,
 * so the card changes about as often as the logo does, and keeping it out of
 * the build avoids shipping native satori/resvg bindings to CI.
 *
 * Fonts are pulled from Google Fonts at run time rather than committed, so the
 * card always matches whatever the site is actually serving.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'og-image.png');

// Dark Garbage Man tokens, mirrored from src/styles/global.css.
const CANVAS = '#14140f';
const SURFACE = '#1b1b15';
const BORDER = '#38382b';
const TEXT_PRIMARY = '#f5f3e8';
const TEXT_MUTED = '#99957f';
const ACCENT = '#f5c518';

const TAGLINE = 'Reclaim disk from build artifacts.';
// Deliberately shorter than the hero copy: a social card is read at thumbnail
// size, and the third line always broke to an orphan.
const SUBTITLE =
  'Finds regenerable targets in your developer workspaces and moves the ones you select to the Trash.';

/** The single path from public/brand/UNCACHED-ICON-LIGHT-NOBG.svg. */
const ICON_PATH =
  'M523 175.238C523 218.564 487.877 253.688 444.55 253.688H359.763C316.437 253.688 281.313 288.811 281.313 332.137V425.238C281.313 468.564 316.437 503.688 359.763 503.688H480.656C504.042 503.688 523 522.645 523 546.031C523 569.417 504.042 588.375 480.656 588.375H78.45C35.1233 588.375 0 553.252 0 509.925L0 78.45C0 35.1233 35.1233 0 78.45 0L444.55 0C487.877 0 523 35.1233 523 78.45V175.238Z';

const iconDataUri = (fill) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="523" height="589" viewBox="0 0 523 589" xmlns="http://www.w3.org/2000/svg"><path d="${ICON_PATH}" fill="${fill}"/></svg>`
  ).toString('base64')}`;

/**
 * Resolves a Google Fonts family to raw TTF bytes. The css2 endpoint only
 * serves truetype to older user agents; modern UA strings get woff2, which
 * satori cannot parse.
 */
async function loadGoogleFont(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}`;
  const css = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const match = css.match(/src: url\((https:\/\/[^)]+\.ttf)\)/);
  if (!match) throw new Error(`No TTF found for ${family} ${weight}`);
  const data = await fetch(match[1]).then((r) => r.arrayBuffer());
  return { name: family, data, weight, style: 'normal' };
}

const el = (type, props, ...children) => ({
  type,
  props: { ...props, children: children.length > 1 ? children : children[0] },
});

const chip = (text) =>
  el(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 20px',
        borderRadius: 999,
        border: `1px solid ${BORDER}`,
        backgroundColor: SURFACE,
        fontFamily: 'Geist Mono',
        fontSize: 22,
        color: TEXT_MUTED,
      },
    },
    el('div', {
      style: { width: 8, height: 8, borderRadius: 999, backgroundColor: ACCENT },
    }),
    text
  );

const template = el(
  'div',
  {
    style: {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 72,
      backgroundColor: CANVAS,
      fontFamily: 'Hanken Grotesk',
    },
  },
  // Header: icon + wordmark
  el(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 16 } },
    el('img', { src: iconDataUri(ACCENT), width: 43, height: 48 }),
    el(
      'div',
      {
        style: {
          fontFamily: 'Geist Mono',
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '0.14em',
          color: TEXT_PRIMARY,
        },
      },
      'UNCACHED'
    )
  ),
  // Body: tagline + subtitle
  el(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
    el(
      'div',
      {
        style: {
          fontSize: 82,
          fontWeight: 600,
          letterSpacing: '-0.045em',
          lineHeight: 1.05,
          color: TEXT_PRIMARY,
        },
      },
      TAGLINE
    ),
    el(
      'div',
      { style: { fontSize: 27, lineHeight: 1.45, color: TEXT_MUTED, maxWidth: 900 } },
      SUBTITLE
    )
  ),
  // Footer chips
  el('div', { style: { display: 'flex', gap: 14 } }, chip('Local-first'), chip('Trash by default'))
);

const fonts = await Promise.all([
  loadGoogleFont('Hanken Grotesk', 400),
  loadGoogleFont('Hanken Grotesk', 600),
  loadGoogleFont('Geist Mono', 600),
]);

const svg = await satori(template, { width: 1200, height: 630, fonts });
const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, png);
console.log(`Wrote ${OUT} (${(png.length / 1024).toFixed(1)} KB)`);
