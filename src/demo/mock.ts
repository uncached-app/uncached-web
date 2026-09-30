import type { ProjectDependencies } from './app/types/dependencies';
import type { ScanTarget } from './app/types/scan';
import type { ToolchainReport } from './app/types/toolchains';
import type {
  ExposedSecret,
  Footprint,
  ObjectStore,
  RecoverabilityLevel,
  Restore,
  Verdict,
  WorkspaceIndex,
  WorkspaceProject,
} from './app/types/workspace';
import { formatBytes } from './app/utils/format.mjs';
import type { CleanupEvent } from './app/utils/report.mjs';

const ROOT = '/Users/you/code';
const DAY = 24 * 60 * 60;
const MB = 1024 * 1024;
const GB = 1024 * MB;

type Artifact = { folder: string; category: string; bytes: number };

type ProjectSeed = {
  name: string;
  kind: string;
  verdict: Verdict;
  idleDays: number;
  sourceBytes: number;
  artifacts: Artifact[];
  restore: Restore;
  risk?: Partial<{ untrackedFiles: number; stashEntries: number; unpushedCommits: number }>;
  commit: string;
  secrets?: ExposedSecret[];
  /** Megabytes of loose objects in `.git`; past 100 Git would repack. */
  looseMb?: number;
};

const NPM: Restore = { manager: 'npm', command: 'npm ci', pinnedBy: 'package-lock.json' };
const PNPM: Restore = { manager: 'pnpm', command: 'pnpm install --frozen-lockfile', pinnedBy: 'pnpm-lock.yaml' };

const SEEDS: ProjectSeed[] = [
  {
    name: 'ledger-api',
    kind: 'Rust',
    verdict: 'protect',
    idleDays: 0,
    sourceBytes: 28.1 * 1024,
    artifacts: [{ folder: 'target', category: 'CargoTarget', bytes: 3.91 * GB }],
    restore: { manager: 'cargo', command: 'cargo build', pinnedBy: 'Cargo.lock' },
    risk: { untrackedFiles: 1 },
    commit: 'Settle invoices in the ledger currency',
    looseMb: 180,
  },
  {
    name: 'design-system',
    kind: 'Node',
    verdict: 'protect',
    idleDays: 3,
    sourceBytes: 4.2 * MB,
    artifacts: [
      { folder: 'node_modules', category: 'NodeModules', bytes: 720 * MB },
      { folder: '.turbo', category: 'Turbo', bytes: 210 * MB },
    ],
    restore: PNPM,
    risk: { stashEntries: 1 },
    commit: 'Tighten the button focus ring',
  },
  {
    name: 'storefront',
    kind: 'Node',
    verdict: 'tradeOff',
    idleDays: 0,
    sourceBytes: 9.6 * MB,
    artifacts: [
      { folder: 'node_modules', category: 'NodeModules', bytes: 1.24 * GB },
      { folder: '.next', category: 'NextJs', bytes: 790 * MB },
    ],
    restore: NPM,
    commit: 'Cache product images at the edge',
    secrets: [
      { path: '.env.production', committed: true, kind: 'env' },
      { path: 'deploy/id_rsa', committed: false, kind: 'privateKey' },
    ],
  },
  {
    name: 'field-app',
    kind: 'Node',
    verdict: 'tradeOff',
    idleDays: 0,
    sourceBytes: 12.4 * MB,
    artifacts: [
      { folder: 'Pods', category: 'ReactNative', bytes: 1.17 * GB },
      { folder: 'node_modules', category: 'NodeModules', bytes: 980 * MB },
    ],
    restore: NPM,
    commit: 'Offline queue for field reports',
  },
  {
    name: 'docs',
    kind: 'Node',
    verdict: 'tradeOff',
    idleDays: 9,
    sourceBytes: 2.3 * MB,
    artifacts: [{ folder: 'node_modules', category: 'NodeModules', bytes: 310 * MB }],
    restore: PNPM,
    commit: 'Document the webhook retries',
  },
  {
    name: 'forecast',
    kind: 'Python',
    verdict: 'safe',
    idleDays: 41,
    sourceBytes: 1.1 * MB,
    artifacts: [
      { folder: '.mypy_cache', category: 'PyCache', bytes: 96 * MB },
      { folder: '__pycache__', category: 'PyCache', bytes: 22 * MB },
    ],
    restore: { manager: 'uv', command: 'uv sync', pinnedBy: 'uv.lock' },
    commit: 'Seasonal baseline for the demand model',
  },
  {
    name: 'old-prototype',
    kind: 'Node',
    verdict: 'safe',
    idleDays: 212,
    sourceBytes: 3.4 * MB,
    artifacts: [{ folder: 'node_modules', category: 'NodeModules', bytes: 640 * MB }],
    restore: NPM,
    commit: 'First pass at the checkout flow',
  },
];

function recoverabilityLevel(seed: ProjectSeed): RecoverabilityLevel {
  return seed.risk ? 'localOnlyWork' : 'fullyRemote';
}

function objectStore(looseMb: number): ObjectStore {
  return {
    looseObjects: Math.round(looseMb * 40),
    looseBytes: looseMb * MB,
    packs: 3,
    packBytes: 48 * MB,
    garbageBytes: 0,
    gcRecommended: looseMb >= 100,
  };
}

function toProject(seed: ProjectSeed, now: number): WorkspaceProject {
  const path = `${ROOT}/${seed.name}`;
  const lastActivityAt = now - seed.idleDays * DAY - 2 * 60 * 60;
  return {
    name: seed.name,
    path,
    root: ROOT,
    kind: seed.kind,
    git: {
      branch: 'main',
      lastCommitSummary: seed.commit,
      lastCommitAt: lastActivityAt,
      dirty: Boolean(seed.risk?.untrackedFiles),
      remote: `git@github.com:acme/${seed.name}.git`,
      remoteIsLocal: false,
      behind: 0,
      lastFetchAt: now - DAY,
      recoverability: {
        unpushedCommits: seed.risk?.unpushedCommits ?? 0,
        branchesWithoutUpstream: 0,
        stashEntries: seed.risk?.stashEntries ?? 0,
        untrackedFiles: seed.risk?.untrackedFiles ?? 0,
        level: recoverabilityLevel(seed),
      },
      exposedSecrets: seed.secrets ?? [],
      objectStore: objectStore(seed.looseMb ?? 1),
    },
    activity: {
      lastActivityAt,
      idleDays: seed.idleDays,
      state: seed.idleDays < 14 ? 'active' : seed.idleDays < 90 ? 'idle' : 'cold',
    },
    duplicateOf: [],
    installMissing: false,
    installStale: false,
    restore: seed.restore,
    family: null,
  };
}

function toFootprint(seed: ProjectSeed): Footprint {
  const reclaimableBytes = seed.artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0);
  const byCategory = new Map<string, number>();
  for (const artifact of seed.artifacts) {
    byCategory.set(artifact.category, (byCategory.get(artifact.category) ?? 0) + artifact.bytes);
  }
  return {
    totalBytes: reclaimableBytes + seed.sourceBytes,
    sourceBytes: seed.sourceBytes,
    reclaimableBytes,
    byCategory: [...byCategory].map(([category, bytes]) => ({ category, bytes })),
    hasErrors: false,
  };
}

function toTargets(seed: ProjectSeed, now: number): ScanTarget[] {
  return seed.artifacts.map((artifact) => ({
    id: `${seed.name}/${artifact.folder}`,
    path: `${ROOT}/${seed.name}/${artifact.folder}`,
    name: artifact.folder,
    label: null,
    category: artifact.category,
    plan: 'free',
    confidence: { level: 'high', signals: ['knownArtifact', 'projectManifest', 'lockfile'] },
    cleanable: true,
    reclaimWith: null,
    blockedBy: null,
    sizeBytes: artifact.bytes,
    lastUsedAt: now - seed.idleDays * DAY,
    sizeHasErrors: false,
    sizePending: false,
    formattedSize: formatBytes(artifact.bytes),
  }));
}

const DEPENDENCIES: ProjectDependencies[] = [
  {
    project: `${ROOT}/field-app`,
    reports: [
      {
        manifest: `${ROOT}/field-app/package.json`,
        ecosystem: 'node',
        declared: 42,
        unused: [
          {
            name: 'expo-status-bar',
            kind: 'runtime',
            confidence: 'high',
            reason: 'notReferenced',
            removeWith: 'npm uninstall expo-status-bar',
          },
        ],
      },
    ],
    unreadable: [],
  },
  {
    project: `${ROOT}/ledger-api`,
    reports: [
      {
        manifest: `${ROOT}/ledger-api/Cargo.toml`,
        ecosystem: 'cargo',
        declared: 18,
        unused: [
          { name: 'regex', kind: 'runtime', confidence: 'high', reason: 'notReferenced', removeWith: 'cargo remove regex' },
        ],
      },
    ],
    unreadable: [],
  },
  {
    project: `${ROOT}/storefront`,
    reports: [
      {
        manifest: `${ROOT}/storefront/package.json`,
        ecosystem: 'node',
        declared: 57,
        unused: [
          { name: 'lodash', kind: 'runtime', confidence: 'high', reason: 'notReferenced', removeWith: 'npm uninstall lodash' },
          {
            name: '@types/lodash',
            kind: 'development',
            confidence: 'medium',
            reason: 'typesOnly',
            removeWith: 'npm uninstall --save-dev @types/lodash',
          },
        ],
      },
    ],
    unreadable: [],
  },
];

/** Twelve weeks of cleanups: `[days ago, GB freed, category, project, trigger]`. */
const HISTORY: [number, number, string, string, CleanupEvent['trigger']][] = [
  [82, 2.4, 'NodeModules', 'storefront', 'Manual'],
  [76, 0.6, 'NextJs', 'storefront', 'Manual'],
  [69, 3.1, 'CargoTarget', 'ledger-api', 'Manual'],
  [63, 0.9, 'NodeModules', 'old-prototype', 'Scheduled'],
  [55, 1.2, 'ReactNative', 'field-app', 'Manual'],
  [49, 0.3, 'PyCache', 'forecast', 'Scheduled'],
  [42, 2.8, 'CargoTarget', 'ledger-api', 'Manual'],
  [35, 1.6, 'NodeModules', 'docs', 'Scheduled'],
  [28, 0.8, 'NextJs', 'storefront', 'Scheduled'],
  [21, 4.2, 'NodeModules', 'field-app', 'Manual'],
  [14, 1.1, 'Turbo', 'design-system', 'Scheduled'],
  [9, 2.3, 'CargoTarget', 'ledger-api', 'Manual'],
  [4, 0.7, 'NodeModules', 'docs', 'Scheduled'],
  [1, 1.9, 'NodeModules', 'storefront', 'Manual'],
];

function toHistory(now: number): CleanupEvent[] {
  return HISTORY.map(([daysAgo, gigabytes, category, project, trigger]) => ({
    at: new Date((now - daysAgo * DAY) * 1000).toISOString(),
    freedBytes: Math.round(gigabytes * GB),
    category,
    path: `${ROOT}/${project}`,
    workspace: ROOT,
    mode: 'Trash',
    trigger,
  }));
}

/** The Free view: how many and how much, not which. */
const TOOLCHAINS: ToolchainReport = {
  installedCount: 11,
  unusedCount: 6,
  unusedBytes: 4.2 * GB,
  unused: [],
  locked: true,
};

export type DemoData = {
  toolchains: ToolchainReport;
  history: CleanupEvent[];
  index: WorkspaceIndex;
  verdicts: Record<string, Verdict>;
  footprints: Record<string, Footprint>;
  targets: ScanTarget[];
  dependencies: ProjectDependencies[];
};

/** `now` in seconds since the epoch; ages in the app are computed against it. */
export function createDemoData(now: number): DemoData {
  const projects = SEEDS.map((seed) => toProject(seed, now));
  return {
    history: toHistory(now),
    index: {
      roots: [ROOT],
      projects,
      rootsOverLimit: [],
      rootLimit: 12,
      truncated: false,
      unreadable: 0,
      unreadableSample: [],
      families: [],
    },
    verdicts: Object.fromEntries(SEEDS.map((seed) => [`${ROOT}/${seed.name}`, seed.verdict])),
    footprints: Object.fromEntries(SEEDS.map((seed) => [`${ROOT}/${seed.name}`, toFootprint(seed)])),
    targets: SEEDS.flatMap((seed) => toTargets(seed, now)),
    dependencies: DEPENDENCIES,
    toolchains: TOOLCHAINS,
  };
}

export const PROTECTED_PROJECT = `${ROOT}/ledger-api`;

export const SECRETS_PROJECT = `${ROOT}/storefront`;
