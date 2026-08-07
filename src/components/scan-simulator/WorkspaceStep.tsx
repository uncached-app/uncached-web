import { FolderOpen, ScanSearch } from 'lucide-react';

interface WorkspaceStepProps {
  rootPath: string;
  onRootPathChange: (path: string) => void;
  onScan: () => void;
}

export default function WorkspaceStep({ rootPath, onRootPathChange, onScan }: WorkspaceStepProps) {
  return (
    <div className="w-full max-w-xl md:max-w-3xl flex flex-col items-center text-center gap-4 sm:gap-6 px-1">
      <div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-text-primary">
          Select a workspace
        </h2>
        <p className="mt-1.5 sm:mt-2 text-pretty text-xs sm:text-sm text-text-muted">
          Uncached scans it for dependency, build, and cache directories your toolchains can regenerate.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <div className="group relative flex items-center gap-2 rounded-xl sm:rounded-2xl border border-border-theme bg-canvas p-1.5 sm:p-2.5 transition-colors focus-within:border-accent hover:border-accent/50">
          <FolderOpen size={16} className="ml-2 shrink-0 text-text-muted transition-colors group-focus-within:text-accent" strokeWidth={1.8} />
          <input
            type="text"
            aria-label="Workspace path"
            value={rootPath}
            onChange={(event) => onRootPathChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-1.5 py-1 font-mono text-xs sm:text-sm text-text-primary outline-none placeholder:text-text-muted"
            placeholder="Select or paste workspace path..."
          />
        </div>
      </div>

      <button type="button" onClick={onScan} className="inline-flex min-h-10 sm:min-h-11 w-full max-w-2xl items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-5 text-xs sm:text-sm font-semibold text-accent-text transition-colors cursor-pointer">
        <ScanSearch size={16} />
        <span>Scan workspace</span>
      </button>
    </div>
  );
}
