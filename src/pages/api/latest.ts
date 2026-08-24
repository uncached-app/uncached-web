import type { APIRoute } from 'astro';
import { downloadsEnabled } from '../../data/flags';

export const prerender = false;

/**
 * Same-origin view of `cdn.uncached.app/latest.json` for the download page.
 *
 * The CDN serves no `Access-Control-Allow-Origin`, so the browser cannot read
 * the manifest directly. This also swaps the macOS updater tarball for the
 * installer a first-time visitor actually wants.
 */

const MANIFEST_URL = 'https://cdn.uncached.app/latest.json';
const CDN_TIMEOUT_MS = 8_000;

/** Matches the manifest's own cache window, so the edge never serves a staler view than the CDN. */
const CACHE_SECONDS = 300;

/** Updater bundle names carry no architecture, so two macOS builds collide without the triple. */
const MACOS_DMG_ARCH: Record<string, string> = {
  'aarch64-apple-darwin': 'aarch64',
  'x86_64-apple-darwin': 'x64',
};

interface Platform {
  readonly key: string;
  readonly os: 'macos' | 'windows' | 'linux';
  readonly label: string;
  readonly detail: string;
}

const PLATFORMS: readonly Platform[] = [
  {
    key: 'darwin-aarch64',
    os: 'macos',
    label: 'macOS',
    detail: 'Apple Silicon — M1 and later',
  },
  { key: 'darwin-x86_64', os: 'macos', label: 'macOS', detail: 'Intel' },
  { key: 'windows-x86_64', os: 'windows', label: 'Windows', detail: '64-bit installer' },
  { key: 'linux-x86_64', os: 'linux', label: 'Linux', detail: 'AppImage, 64-bit' },
];

interface Download {
  readonly key: string;
  readonly os: string;
  readonly label: string;
  readonly detail: string;
  readonly url: string;
  readonly filename: string;
}

function readString(source: unknown, path: string[]): string | undefined {
  let value: unknown = source;
  for (const segment of path) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function filenameOf(url: string): string {
  return url.slice(url.lastIndexOf('/') + 1);
}

/**
 * `Uncached.app.tar.gz` is the updater artifact: double-clicking it leaves a
 * bare .app in Downloads. The release uploads a .dmg beside it, so the URL is
 * derived from the tarball's own directory and confirmed before being offered.
 */
async function preferMacosInstaller(tarballUrl: string, version: string): Promise<string> {
  const directory = tarballUrl.slice(0, tarballUrl.lastIndexOf('/'));
  const triple = directory.slice(directory.lastIndexOf('/') + 1);
  const arch = MACOS_DMG_ARCH[triple];
  if (!arch) return tarballUrl;

  const dmgUrl = `${directory}/Uncached_${version}_${arch}.dmg`;
  try {
    const response = await fetch(dmgUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(CDN_TIMEOUT_MS),
    });
    return response.ok ? dmgUrl : tarballUrl;
  } catch {
    return tarballUrl;
  }
}

async function resolveDownload(
  platform: Platform,
  manifest: unknown,
  version: string,
): Promise<Download | null> {
  const url = readString(manifest, ['platforms', platform.key, 'url']);
  if (!url) return null;

  const resolved = platform.os === 'macos' ? await preferMacosInstaller(url, version) : url;
  return {
    key: platform.key,
    os: platform.os,
    label: platform.label,
    detail: platform.detail,
    url: resolved,
    filename: filenameOf(resolved),
  };
}

export const GET: APIRoute = async () => {
  if (!downloadsEnabled) return new Response('not found', { status: 404 });

  let manifest: unknown;
  try {
    const response = await fetch(MANIFEST_URL, { signal: AbortSignal.timeout(CDN_TIMEOUT_MS) });
    if (!response.ok) {
      console.error('[latest] cdn returned', response.status);
      return new Response('upstream unavailable', { status: 502 });
    }
    manifest = await response.json();
  } catch (error) {
    console.error('[latest] cdn unreachable', error);
    return new Response('upstream unavailable', { status: 502 });
  }

  const version = readString(manifest, ['version']);
  if (!version) {
    console.error('[latest] manifest carries no version');
    return new Response('unreadable manifest', { status: 502 });
  }

  const resolved = await Promise.all(
    PLATFORMS.map((platform) => resolveDownload(platform, manifest, version)),
  );

  return new Response(
    JSON.stringify({
      version,
      notes: readString(manifest, ['notes']) ?? '',
      pubDate: readString(manifest, ['pub_date']) ?? null,
      downloads: resolved.filter((entry): entry is Download => entry !== null),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      },
    },
  );
};
