import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Box,
  Check,
  Folder,
  FolderOpen,
  Layers,
  LoaderCircle,
  Package,
  RotateCcw,
  ScanSearch,
  Trash2,
  Ban,
  CheckSquare,
  Square,
} from 'lucide-react';

interface TargetItem {
  id: string;
  name: string;
  category: string;
  path: string;
  size: string;
  bytes: number;
}

const INITIAL_TARGETS: TargetItem[] = [
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
    name: 'ai-service .venv',
    category: 'PYTHON_VENV',
    path: '~/projects/ai-service/.venv',
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

const STEPS = ['Workspace', 'Scan', 'Review', 'Done'] as const;

export default function ScanSimulator() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [rootPath, setRootPath] = useState('~/projects/workspace');
  const [dirCount, setDirCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['1', '2', '3', '4']));
  const [isCleaning, setIsCleaning] = useState(false);
  const [reclaimedSummary, setReclaimedSummary] = useState({ count: 4, size: '15.12 GB' });

  // Handle Scanning Step 2 animation
  useEffect(() => {
    if (step === 2) {
      setDirCount(0);
      const interval = setInterval(() => {
        setDirCount((prev) => {
          if (prev >= 1420) {
            clearInterval(interval);
            return 1420;
          }
          return prev + 142;
        });
      }, 100);

      const timer = setTimeout(() => {
        setStep(3);
      }, 1800);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [step]);

  // Handle Confetti Burst on Step 4
  useEffect(() => {
    if (step === 4) {
      const burst = (origin: { x: number; y: number }, angle: number) => {
        confetti({
          particleCount: 28,
          angle,
          spread: 48,
          startVelocity: 22,
          gravity: 1.2,
          origin,
          colors: ['#b9d98d', '#ffc2b5', '#edf0eb'],
          zIndex: 100,
        });
      };

      burst({ x: 0.5, y: 0.65 }, 90);
      const t1 = setTimeout(() => burst({ x: 0.28, y: 0.72 }, 65), 500);
      const t2 = setTimeout(() => burst({ x: 0.72, y: 0.72 }, 115), 1000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [step]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === INITIAL_TARGETS.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(INITIAL_TARGETS.map((t) => t.id)));
    }
  };

  const selectedTargets = INITIAL_TARGETS.filter((t) => selectedIds.has(t.id));
  const totalSelectedBytes = selectedTargets.reduce((acc, t) => acc + t.bytes, 0);
  const formattedSelectedSize = (totalSelectedBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';

  const handleClean = () => {
    setIsCleaning(true);
    setReclaimedSummary({
      count: selectedTargets.length,
      size: formattedSelectedSize,
    });
    setTimeout(() => {
      setIsCleaning(false);
      setStep(4);
    }, 1300);
  };

  const resetAll = () => {
    setStep(1);
    setSelectedIds(new Set(['1', '2', '3', '4']));
  };

  function getCategoryIcon(category: string) {
    if (category.includes('NODE')) return <Package size={11} className="text-accent" aria-hidden="true" />;
    if (category.includes('RUST')) return <Box size={11} className="text-accent" aria-hidden="true" />;
    if (category.includes('PYTHON')) return <Folder size={11} className="text-accent" aria-hidden="true" />;
    return <Layers size={11} className="text-accent" aria-hidden="true" />;
  }

  return (
    <div className="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto rounded-2xl sm:rounded-3xl bg-surface border border-border-theme p-4 sm:p-8 overflow-hidden min-h-[440px] sm:h-[480px] md:h-[510px] flex flex-col justify-between select-none text-text-primary transition-colors">
      {/* Titlebar Header */}
      <div className="flex items-center justify-center pb-3 sm:pb-4 shrink-0 border-b border-border-theme">
        {/* Progress Pipeline */}
        <nav aria-label="Progress pipeline" className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm">
          {STEPS.map((label, index) => {
            const stepNumber = (index + 1) as 1 | 2 | 3 | 4;
            const isCurrent = step === stepNumber;
            const isPassed = step > stepNumber;
            return (
              <span
                key={label}
                className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 font-medium transition-colors ${
                  isCurrent
                    ? 'bg-raised text-accent'
                    : isPassed
                    ? 'text-text-secondary'
                    : 'text-text-muted'
                }`}
              >
                <span
                  className={`grid size-3.5 sm:size-4 place-items-center rounded-full text-[9px] sm:text-[10px] font-mono ${
                    isCurrent
                      ? 'bg-accent font-bold text-accent-text'
                      : isPassed
                      ? 'bg-raised text-accent'
                      : 'bg-canvas text-text-muted'
                  }`}
                >
                  {isPassed ? <Check size={9} strokeWidth={3} /> : stepNumber}
                </span>
                <span className="text-[11px] sm:text-sm">{label}</span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* Main Step Content Container (Fixed Responsive Height Viewport) */}
      <div className="flex-1 flex items-center justify-center overflow-hidden py-3 sm:py-4">
        <AnimatePresence mode="wait">
          {/* STEP 1: WORKSPACE SELECTION */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl md:max-w-3xl flex flex-col items-center text-center gap-4 sm:gap-6 px-1"
            >
              <div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-text-primary">
                  Reclaim disk from build artifacts.
                </h2>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-text-muted">
                  Finds dependency, build, and cache directories your toolchains can regenerate.
                </p>
              </div>

              <div className="w-full max-w-2xl">
                <div className="group relative flex items-center gap-2 rounded-xl sm:rounded-2xl border border-border-theme bg-canvas p-1.5 sm:p-2.5 transition-colors focus-within:border-accent hover:border-accent/50">
                  <FolderOpen size={16} className="ml-2 shrink-0 text-text-muted transition-colors group-focus-within:text-accent" strokeWidth={1.8} />
                  <input
                    type="text"
                    value={rootPath}
                    onChange={(e) => setRootPath(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-1.5 py-1 font-mono text-xs sm:text-sm text-text-primary outline-none placeholder:text-text-muted"
                    placeholder="Select or paste workspace path..."
                  />
                  <button
                    type="button"
                    onClick={() => {}}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg sm:rounded-xl bg-raised px-3 py-1.5 sm:py-2 text-xs font-medium text-text-secondary hover:bg-border-theme hover:text-accent transition-colors cursor-pointer border border-border-theme"
                  >
                    <FolderOpen size={13} strokeWidth={1.8} />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              {/* Scan Action Button */}
              <button
                onClick={() => setStep(2)}
                className="inline-flex min-h-10 sm:min-h-11 w-full max-w-2xl items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-5 text-xs sm:text-sm font-semibold text-accent-text transition-colors cursor-pointer"
              >
                <ScanSearch size={16} />
                <span>Scan workspace</span>
              </button>
            </motion.div>
          )}

          {/* STEP 2: SCANNING VIEW */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center text-center px-2 sm:px-4"
            >
              <div className="mb-4 sm:mb-5 grid size-12 sm:size-14 place-items-center text-accent">
                <LoaderCircle size={36} className="animate-spin" strokeWidth={1.5} />
              </div>

              <h2 className="text-xl sm:text-3xl font-semibold tracking-tight text-text-primary">
                Scanning workspace
              </h2>

              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-text-muted max-w-xs sm:max-w-md">
                Targets are measured as they are found in <code className="font-mono text-accent">{rootPath}</code>.
              </p>

              <div className="mt-5 sm:mt-6 flex min-h-14 sm:min-h-16 items-center justify-center gap-6 sm:gap-14 rounded-xl sm:rounded-2xl bg-canvas border border-border-theme px-5 sm:px-8 py-3 sm:py-4 text-center">
                <div>
                  <strong className="block font-mono text-xl sm:text-3xl font-medium tracking-tight text-accent">
                    {dirCount.toLocaleString()}
                  </strong>
                  <span className="mt-0.5 sm:mt-1 block font-sans text-[10px] sm:text-xs text-text-muted">directories checked</span>
                </div>
                <div className="w-[1px] h-7 sm:h-8 bg-border-theme"></div>
                <div>
                  <strong className="block font-mono text-xl sm:text-3xl font-medium tracking-tight text-accent">
                    4
                  </strong>
                  <span className="mt-0.5 sm:mt-1 block font-sans text-[10px] sm:text-xs text-text-muted">findings found</span>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-destructive px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-canvas hover:bg-destructive-hover transition-colors cursor-pointer"
                >
                  <Ban size={13} />
                  <span>Cancel scan</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: FINDINGS SECTION */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col gap-3 sm:gap-4"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-2xl font-semibold text-text-primary tracking-tight">4 targets</h3>
                    <span className="rounded-md border border-accent bg-canvas px-2 py-0.5 font-mono text-[10px] sm:text-xs font-medium text-accent">
                      15.12 GB total
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 hidden xs:block">
                    Selected targets move to the Recycle Bin. Restorable from there.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs sm:text-sm font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                >
                  {selectedIds.size === INITIAL_TARGETS.length ? (
                    <>
                      <CheckSquare size={13} /> Unselect All
                    </>
                  ) : (
                    <>
                      <Square size={13} /> Select All
                    </>
                  )}
                </button>
              </div>

              {/* Target Cards List */}
              <div className="flex flex-col gap-2 max-h-48 sm:max-h-64 overflow-y-auto pr-1">
                {INITIAL_TARGETS.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <article
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`group flex items-center justify-between select-none gap-2 rounded-xl border p-2.5 sm:p-3.5 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-accent bg-canvas'
                          : 'border-border-theme bg-canvas/70 hover:border-accent/60'
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div
                          className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-all ${
                            isSelected
                              ? 'border-accent bg-accent text-accent-text'
                              : 'border-border-theme bg-surface text-transparent group-hover:border-accent/50'
                          }`}
                        >
                          <Check size={11} strokeWidth={3} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded border border-border-theme bg-raised px-1.5 py-0.5 font-mono text-[9px] sm:text-xs font-medium text-accent">
                              {getCategoryIcon(item.category)}
                              {item.category}
                            </span>
                            <span className="text-xs sm:text-sm text-text-secondary font-medium truncate">{item.name}</span>
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[10px] sm:text-xs text-text-muted max-w-[180px] xs:max-w-[260px] sm:max-w-none">
                            {item.path}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0 pl-2">
                        <strong className={`text-xs sm:text-base font-semibold ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>
                          {item.size}
                        </strong>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Bottom Action Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-border-theme">
                <div className="flex items-center justify-between sm:block">
                  <span className="text-[11px] text-text-muted">Selected Space: </span>
                  <strong className="font-mono text-sm sm:text-lg font-bold text-accent">
                    {selectedTargets.length > 0 ? `${selectedTargets.length} selected · ${formattedSelectedSize}` : '0 selected · 0.00 GB'}
                  </strong>
                </div>

                <button
                  onClick={handleClean}
                  disabled={selectedTargets.length === 0 || isCleaning}
                  className="w-full sm:w-auto inline-flex flex-row items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-destructive hover:bg-destructive-hover text-canvas font-semibold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-40"
                >
                  {isCleaning ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      <span>Cleaning...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>
                        Delete ({selectedTargets.length})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: COMPLETION VIEW */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center text-center px-2 sm:px-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                className="grid size-12 sm:size-16 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent"
              >
                <Check size={26} strokeWidth={2} />
              </motion.div>

              <h2 className="mt-3 sm:mt-5 text-2xl sm:text-4xl font-semibold tracking-tight text-text-primary">
                Cleanup complete
              </h2>

              <p className="mt-1.5 max-w-xs text-xs sm:text-sm leading-relaxed text-text-muted">
                {reclaimedSummary.count} {reclaimedSummary.count === 1 ? 'target' : 'targets'} moved to the Recycle Bin.
              </p>

              {/* Stats Metrics Cards */}
              <div className="mt-4 sm:mt-6 flex gap-3 sm:gap-4">
                <div className="rounded-xl sm:rounded-2xl border border-border-theme bg-canvas px-4 py-2.5 sm:px-6 sm:py-3.5 text-left">
                  <span className="block text-[10px] sm:text-xs uppercase tracking-wider text-text-muted">Targets removed</span>
                  <strong className="mt-0.5 sm:mt-1 block text-lg sm:text-2xl text-text-primary font-mono">{reclaimedSummary.count}</strong>
                </div>
                <div className="rounded-xl sm:rounded-2xl border border-border-theme bg-canvas px-4 py-2.5 sm:px-6 sm:py-3.5 text-left">
                  <span className="block text-[10px] sm:text-xs uppercase tracking-wider text-text-muted">Space reclaimed</span>
                  <strong className="mt-0.5 sm:mt-1 block text-lg sm:text-2xl text-accent font-mono">{reclaimedSummary.size}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={resetAll}
                className="mt-5 sm:mt-6 inline-flex min-h-9 sm:min-h-10 items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-5 sm:px-6 text-xs sm:text-sm font-semibold text-accent-text transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Scan another workspace</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
