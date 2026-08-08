import { Box, Check, Folder, Layers, Package, Square, CheckSquare, LoaderCircle, Trash2 } from 'lucide-react';
import { INITIAL_TARGETS, TARGET_COUNT, TOTAL_SIZE, type TargetItem } from './scanSimulatorData';

interface ReviewStepProps {
  selectedIds: Set<string>;
  selectedTargets: TargetItem[];
  formattedSelectedSize: string;
  isCleaning: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onClean: () => void;
}

function getCategoryIcon(category: string) {
  if (category.includes('NODE')) return <Package size={11} className="text-accent" aria-hidden="true" />;
  if (category.includes('RUST')) return <Box size={11} className="text-accent" aria-hidden="true" />;
  if (category.includes('PYTHON')) return <Folder size={11} className="text-accent" aria-hidden="true" />;
  return <Layers size={11} className="text-accent" aria-hidden="true" />;
}

export default function ReviewStep({ selectedIds, selectedTargets, formattedSelectedSize, isCleaning, onToggle, onToggleAll, onClean }: ReviewStepProps) {
  return (
    <div className="w-full flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-2xl font-semibold text-text-primary tracking-tight">{TARGET_COUNT} targets</h3>
            <span className="rounded-md border border-accent bg-canvas px-2 py-0.5 font-mono text-[10px] sm:text-xs font-medium text-accent">{TOTAL_SIZE} total</span>
          </div>
          <p className="text-[11px] font-sans text-text-muted mt-0.5 hidden xs:block">Selected targets move to the Recycle Bin. Restorable from there.</p>
        </div>
        <button type="button" onClick={onToggleAll} className="text-xs sm:text-sm font-mono text-accent hover:underline flex items-center gap-1.5 cursor-pointer ml-auto focus-visible:outline-2 focus-visible:outline-accent rounded px-1">
          {selectedIds.size === INITIAL_TARGETS.length ? <><CheckSquare size={13} /> Unselect all</> : <><Square size={13} /> Select all</>}
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-full sm:max-h-full overflow-y-auto pr-1">
        {INITIAL_TARGETS.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <article key={item.id} role="checkbox" aria-checked={isSelected} aria-label={`${item.name} (${item.size})`} tabIndex={0} onClick={() => onToggle(item.id)} onKeyDown={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                onToggle(item.id);
              }
            }} className={`group flex items-center justify-between select-none gap-2.5 rounded-xl border p-2.5 sm:p-3.5 transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.99] active:translate-y-[1px] ${isSelected ? 'border-accent bg-canvas' : 'border-border-theme bg-canvas/70 hover:border-accent/60'}`}>
              <div className="flex min-w-0 items-start gap-2.5">
                <div className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-all ${isSelected ? 'border-accent bg-accent text-accent-text' : 'border-border-theme bg-surface text-transparent group-hover:border-accent/50'}`}><Check size={11} strokeWidth={3} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded border border-border-theme bg-raised px-1.5 py-0.5 font-mono text-[9px] sm:text-xs font-medium text-accent">{getCategoryIcon(item.category)}{item.category}</span>
                    <span className="text-xs sm:text-sm text-text-secondary font-medium truncate">{item.name}</span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10px] sm:text-xs text-text-muted max-w-45 xs:max-w-[260px] sm:max-w-none">{item.path}</p>
                </div>
              </div>
              <div className="flex items-center justify-end shrink-0 pl-2"><strong className={`font-mono text-xs sm:text-base font-semibold ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>{item.size}</strong></div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-border-theme">
        <div className="flex items-center justify-between sm:block"><span className="text-[11px] font-sans text-text-muted">Targets selected: </span><strong className="font-mono text-xs sm:text-sm font-bold text-accent block sm:inline mt-0.5 sm:mt-0">{selectedTargets.length > 0 ? `${selectedTargets.length} selected · ${formattedSelectedSize}` : '0 selected · 0 B'}</strong></div>
        <button type="button" onClick={onClean} disabled={selectedTargets.length === 0 || isCleaning} className="w-full sm:w-auto inline-flex min-h-11 flex-row items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive-hover text-accent-text font-semibold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.99] active:translate-y-[1px]">
          {isCleaning ? <><LoaderCircle size={14} className="animate-spin" /><span>Moving to Recycle Bin...</span></> : <><Trash2 size={14} /><span>{selectedTargets.length > 0 ? `Move to Recycle Bin (${selectedTargets.length})` : 'Move to Recycle Bin'}</span></>}
        </button>
      </div>
    </div>
  );
}
