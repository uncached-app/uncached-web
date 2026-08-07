import { Ban, LoaderCircle } from 'lucide-react';
import { TARGET_COUNT } from './scanSimulatorData';

interface ScanningStepProps {
  rootPath: string;
  dirCount: number;
  onCancel: () => void;
}

export default function ScanningStep({ rootPath, dirCount, onCancel }: ScanningStepProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-2 sm:px-4">
      <div className="mb-4 sm:mb-5 grid size-12 sm:size-14 place-items-center text-accent">
        <LoaderCircle size={36} className="animate-spin" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl sm:text-3xl font-semibold tracking-tight text-text-primary">Scanning workspace</h2>
      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-text-muted max-w-xs sm:max-w-md">
        Targets are measured as they are found in <code className="font-mono text-accent">{rootPath}</code>.
      </p>
      <div className="mt-5 sm:mt-6 flex min-h-14 sm:min-h-16 items-center justify-center gap-6 sm:gap-14 rounded-xl sm:rounded-2xl bg-canvas border border-border-theme px-5 sm:px-8 py-3 sm:py-4 text-center">
        <div>
          <strong className="block font-mono text-xl sm:text-3xl font-medium tracking-tight text-accent">{dirCount.toLocaleString()}</strong>
          <span className="mt-0.5 sm:mt-1 block font-sans text-[10px] sm:text-xs text-text-muted">directories checked</span>
        </div>
        <div className="w-px h-7 sm:h-8 bg-border-theme" />
        <div>
          <strong className="block font-mono text-xl sm:text-3xl font-medium tracking-tight text-accent">{TARGET_COUNT}</strong>
          <span className="mt-0.5 sm:mt-1 block font-sans text-[10px] sm:text-xs text-text-muted">targets found</span>
        </div>
      </div>
      <div className="mt-5 sm:mt-6">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-destructive px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-canvas hover:bg-destructive-hover transition-colors cursor-pointer">
          <Ban size={13} />
          <span>Cancel scan</span>
        </button>
      </div>
    </div>
  );
}
