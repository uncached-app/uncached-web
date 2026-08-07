export interface TargetItem {
  id: string;
  name: string;
  category: string;
  path: string;
  size: string;
  bytes: number;
}

export const INITIAL_TARGETS: TargetItem[] = [
  {
    id: '1',
    name: 'web-app node_modules',
    category: 'NODE_MODULES',
    path: '~/projects/web-app/node_modules',
    size: '8.40 GB',
    bytes: 8.4 * 1024 * 1024 * 1024,
  },
  {
    id: '2',
    name: 'tauri-app target',
    category: 'RUST_BUILD',
    path: '~/projects/tauri-app/src-tauri/target',
    size: '4.10 GB',
    bytes: 4.1 * 1024 * 1024 * 1024,
  },
  {
    id: '3',
    name: 'ai-service __pycache__',
    category: 'PYTHON_CACHE',
    path: '~/projects/ai-service/__pycache__',
    size: '1.70 GB',
    bytes: 1.7 * 1024 * 1024 * 1024,
  },
  {
    id: '4',
    name: 'mobile-app .gradle',
    category: 'GRADLE_CACHE',
    path: '~/projects/mobile-app/android/.gradle',
    size: '920 MB',
    bytes: 0.92 * 1024 * 1024 * 1024,
  },
];

export const TARGET_COUNT = INITIAL_TARGETS.length;
export const TOTAL_BYTES = INITIAL_TARGETS.reduce((total, target) => total + target.bytes, 0);
export const TOTAL_SIZE = `${(TOTAL_BYTES / (1024 * 1024 * 1024)).toFixed(2)} GB`;

export const STEPS = ['Workspace', 'Scan', 'Review', 'Reclaimed'] as const;

export type ScanStep = 1 | 2 | 3 | 4;
