/**
 * Renders the social brand kit into brand-kit/: banners, avatars, a link
 * preview card, and the logo as SVG.
 *
 *   node scripts/generate-brand-kit.mjs
 *
 * The mark and letter paths are read from src/components/Logo.astro, so the kit
 * is drawn from the same logo the site renders. Fonts come from Google Fonts at
 * run time, as in generate-og.mjs.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'brand-kit');

const TAGLINE = 'Reclaim disk from build artifacts.';

/** Bounds of the paths in Logo.astro's 3226 x 589 viewBox. */
const MARK_BOX = { x: 0, y: 0, width: 523, height: 588.4 };
const WORDMARK_BOX = { x: 717.5, y: 107.9, width: 2467.9, height: 373.3 };

const THEMES = {
  dark: { background: '#14140f', mark: '#f5c518', wordmark: '#f5f3e8', tagline: '#ccc8b4' },
  yellow: { background: '#f5c518', mark: '#14140f', wordmark: '#14140f', tagline: '#3a3000' },
};

async function readLogoPaths() {
  const source = await readFile(join(ROOT, 'src', 'components', 'Logo.astro'), 'utf8');
  const mark = source.match(/<path class="mark" d="([^"]+)"/)?.[1];
  const letters = [...source.matchAll(/<path class="letter" style="[^"]*" d="([^"]+)"/g)].map((match) => match[1]);
  if (!mark || letters.length !== 8) throw new Error('Logo.astro no longer has one mark and eight letters');
  return { mark, letters };
}

function svg(box, paths, fill) {
  const body = paths.map((d) => `<path d="${d}" fill="${fill}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" width="${box.width}" height="${box.height}">${body}</svg>`;
}

function dataUri(markup) {
  return `data:image/svg+xml;base64,${Buffer.from(markup).toString('base64')}`;
}

const el = (type, style, ...children) => ({
  type,
  props: { style, children: children.length > 1 ? children : children[0] },
});

const image = (src, width, height) => ({ type: 'img', props: { src, width, height } });

function canvas(width, height, theme, child) {
  return el(
    'div',
    { width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
    child,
  );
}

async function loadGoogleFont(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}`;
  const css = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((response) => response.text());
  const match = css.match(/src: url\((https:\/\/[^)]+\.ttf)\)/);
  if (!match) throw new Error(`No TTF found for ${family} ${weight}`);
  const data = await fetch(match[1]).then((response) => response.arrayBuffer());
  return { name: family, data, weight, style: 'normal' };
}

async function renderPng(name, width, height, node, fonts) {
  const markup = await satori(node, { width, height, fonts });
  const png = new Resvg(markup, { fitTo: { mode: 'width', value: width } }).render().asPng();
  await writeFile(join(OUT, name), png);
  console.log(`${name} ${width}x${height}`);
}

/** Folders the scanner recognises, from uncached-core's providers. */
const FOLDERS = [
  'node_modules', 'target', '.next', 'Pods', 'DerivedData', '__pycache__', '.gradle', 'build', '.turbo',
  '.svelte-kit', '.nuxt', 'dist-newstyle', '.dart_tool', '_build', '.mypy_cache', 'zig-out', '.terraform',
  'obj', 'bin', '.pytest_cache', '.expo', '.angular', 'vendor', '.stack-work', 'cmake-build-debug', '.tox',
];
/** Every n-th name is drawn struck through in yellow: the ones being reclaimed. */
const STRUCK_EVERY = 7;

function folderWall(width, height, theme) {
  const names = Array.from({ length: Math.ceil((width * height) / 2600) }, (_, index) => FOLDERS[(index * 5) % FOLDERS.length]);
  return el(
    'div',
    {
      position: 'absolute',
      top: -20,
      left: -40,
      width: width + 80,
      height: height + 40,
      display: 'flex',
      flexWrap: 'wrap',
      gap: '14px 30px',
      fontFamily: 'Geist Mono',
      fontSize: 24,
      lineHeight: 1,
    },
    ...names.map((name, index) =>
      el(
        'div',
        index % STRUCK_EVERY === 3
          ? { display: 'flex', color: theme.mark, textDecoration: 'line-through' }
          : { display: 'flex', color: '#2c2c22' },
        name,
      ),
    ),
  );
}

function hazardTape(width, height) {
  const stripe = 28;
  const count = Math.ceil((width + height) / (stripe * 2)) + 2;
  const bands = Array.from({ length: count }, (_, index) => {
    const x = index * stripe * 2 - height;
    return `<polygon points="${x},${height} ${x + stripe},${height} ${x + stripe + height},0 ${x + height},0" fill="#14140f"/>`;
  }).join('');
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#f5c518"/>${bands}</svg>`;
  return image(dataUri(markup), width, height);
}

const logo = await readLogoPaths();
const fonts = [await loadGoogleFont('Hanken Grotesk', 500), await loadGoogleFont('Geist Mono', 400)];
await mkdir(OUT, { recursive: true });

const { dark, yellow } = THEMES;
const avatarMark = (theme, size) =>
  image(dataUri(svg(MARK_BOX, [logo.mark], theme.mark)), (size * 0.5 * MARK_BOX.width) / MARK_BOX.height, size * 0.5);

await renderPng('avatar-dark.png', 800, 800, canvas(800, 800, dark, avatarMark(dark, 800)), fonts);
await renderPng('avatar-yellow.png', 800, 800, canvas(800, 800, yellow, avatarMark(yellow, 800)), fonts);

const fullBox = { x: 0, y: 0, width: 3226, height: 589 };
const logoSvg = (markFill, wordmarkFill) =>
  svg(fullBox, [logo.mark], markFill).replace('</svg>', logo.letters.map((d) => `<path d="${d}" fill="${wordmarkFill}"/>`).join('') + '</svg>');

/** The full logo as the site draws it, sized by height. */
const logoImage = (theme, height) =>
  image(dataUri(logoSvg(theme.mark, theme.wordmark)), (height * fullBox.width) / fullBox.height, height);

const MEASURE_SIZE = 100;

/** Rendered width of `text` at `MEASURE_SIZE`px, read from the pixels rather than estimated. */
async function measureText(text, style) {
  const width = 4000;
  const height = MEASURE_SIZE * 2;
  const node = el(
    'div',
    { width, height, display: 'flex', alignItems: 'center' },
    el('div', { display: 'flex', ...style, fontSize: MEASURE_SIZE, lineHeight: 1, color: '#ffffff' }, text),
  );
  const markup = await satori(node, { width, height, fonts });
  const { pixels } = new Resvg(markup).render();
  let left = width;
  let right = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  }
  return { ink: right - left + 1, lead: left };
}

const TAGLINE_STYLE = { fontFamily: 'Hanken Grotesk', fontWeight: 500, letterSpacing: '-0.01em' };
const taglineAtMeasure = await measureText(TAGLINE, TAGLINE_STYLE);

/**
 * The logo with the tagline under the name, running from the U to the D. The
 * font size is solved from the measured ink width, and the side bearing of the
 * first glyph is cancelled so the ink starts where the U does.
 */
function logoWithTagline(theme, logoHeight) {
  const logoWidth = (logoHeight * fullBox.width) / fullBox.height;
  const scale = logoWidth / fullBox.width;
  const nameLeft = WORDMARK_BOX.x * scale;
  const nameWidth = WORDMARK_BOX.width * scale;
  const fontSize = (MEASURE_SIZE * nameWidth) / taglineAtMeasure.ink;
  const bearing = (taglineAtMeasure.lead * fontSize) / MEASURE_SIZE;
  return el(
    'div',
    { display: 'flex', flexDirection: 'column' },
    logoImage(theme, logoHeight),
    el(
      'div',
      {
        display: 'flex',
        ...TAGLINE_STYLE,
        fontSize,
        lineHeight: 1,
        marginTop: logoHeight * 0.14,
        marginLeft: nameLeft - bearing,
        color: theme.tagline,
      },
      TAGLINE,
    ),
  );
}

async function foldersBanner(name, width, height, logoHeight) {
  await renderPng(
    name,
    width,
    height,
    el(
      'div',
      { width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: dark.background, position: 'relative' },
      folderWall(width, height, dark),
      el(
        'div',
        {
          display: 'flex',
          padding: `${logoHeight * 0.55}px ${logoHeight * 0.75}px`,
          borderRadius: logoHeight * 0.3,
          backgroundColor: dark.background,
          border: '1px solid #38382b',
        },
        logoImage(dark, logoHeight),
      ),
    ),
    fonts,
  );
}

await foldersBanner('banner-x-folders.png', 1500, 500, 96);
await foldersBanner('banner-linkedin-folders.png', 1584, 396, 84);
await foldersBanner('social-preview-folders.png', 1280, 640, 104);

await renderPng('banner-x-dark.png', 1500, 500, canvas(1500, 500, dark, logoWithTagline(dark, 100)), fonts);
await renderPng('banner-x-yellow.png', 1500, 500, canvas(1500, 500, yellow, logoWithTagline(yellow, 100)), fonts);
await renderPng('banner-linkedin-dark.png', 1584, 396, canvas(1584, 396, dark, logoWithTagline(dark, 86)), fonts);
await renderPng('social-preview-dark.png', 1280, 640, canvas(1280, 640, dark, logoWithTagline(dark, 116)), fonts);

await renderPng(
  'banner-x-hazard.png',
  1500,
  500,
  el(
    'div',
    { width: 1500, height: 500, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', backgroundColor: dark.background },
    hazardTape(1500, 40),
    logoWithTagline(dark, 100),
    hazardTape(1500, 40),
  ),
  fonts,
);

// resvg decodes PNG, not WebP: this is public/screens/01-workspace.webp re-encoded.
const workspace = await readFile(join(ROOT, 'scripts', 'brand-assets', 'workspace.png'));
await renderPng(
  'banner-x-app.png',
  1500,
  500,
  el(
    'div',
    { width: 1500, height: 500, display: 'flex', alignItems: 'center', backgroundColor: dark.background, position: 'relative' },
    el('div', { display: 'flex', paddingLeft: 110 }, logoWithTagline(dark, 84)),
    el(
      'div',
      {
        position: 'absolute',
        left: 860,
        top: 90,
        width: 900,
        height: 666,
        display: 'flex',
        borderRadius: 16,
        border: '1px solid #38382b',
        overflow: 'hidden',
      },
      image(`data:image/png;base64,${workspace.toString('base64')}`, 900, 666),
    ),
  ),
  fonts,
);

await writeFile(join(OUT, 'logo-on-dark.svg'), logoSvg(dark.mark, dark.wordmark));
await writeFile(join(OUT, 'logo-on-light.svg'), logoSvg('#14140f', '#14140f'));
await writeFile(join(OUT, 'mark-yellow.svg'), svg(MARK_BOX, [logo.mark], '#f5c518'));
await writeFile(join(OUT, 'mark-dark.svg'), svg(MARK_BOX, [logo.mark], '#14140f'));
console.log('logo-on-dark.svg logo-on-light.svg mark-yellow.svg mark-dark.svg');
