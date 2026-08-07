import { useEffect, useRef, useState } from 'react';
import { INITIAL_TARGETS, TARGET_COUNT, TOTAL_SIZE, type ScanStep } from './scanSimulatorData';

const INITIAL_SELECTED_IDS = new Set(INITIAL_TARGETS.map((target) => target.id));

export default function useScanSimulator() {
  const [step, setStep] = useState<ScanStep>(1);
  const [rootPath, setRootPath] = useState('~/projects/workspace');
  const [dirCount, setDirCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(INITIAL_SELECTED_IDS));
  const [isCleaning, setIsCleaning] = useState(false);
  const [reclaimedSummary, setReclaimedSummary] = useState({ count: TARGET_COUNT, size: TOTAL_SIZE });
  const cleaningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (step !== 2) return;

    setDirCount(0);
    const interval = setInterval(() => {
      setDirCount((previous) => {
        if (previous >= 1420) {
          clearInterval(interval);
          return 1420;
        }
        return previous + 142;
      });
    }, 100);

    const timer = setTimeout(() => setStep(3), 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [step]);

  useEffect(() => {
    return () => {
      if (cleaningTimerRef.current) clearTimeout(cleaningTimerRef.current);
    };
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((previous) =>
      previous.size === INITIAL_TARGETS.length ? new Set() : new Set(INITIAL_SELECTED_IDS),
    );
  };

  const selectedTargets = INITIAL_TARGETS.filter((target) => selectedIds.has(target.id));
  const totalSelectedBytes = selectedTargets.reduce((total, target) => total + target.bytes, 0);
  const formattedSelectedSize = `${(totalSelectedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;

  const handleClean = () => {
    setIsCleaning(true);
    setReclaimedSummary({ count: selectedTargets.length, size: formattedSelectedSize });

    cleaningTimerRef.current = setTimeout(() => {
      setIsCleaning(false);
      setStep(4);
    }, 1300);
  };

  const resetAll = () => {
    setStep(1);
    setSelectedIds(new Set(INITIAL_SELECTED_IDS));
  };

  return {
    step,
    setStep,
    rootPath,
    setRootPath,
    dirCount,
    selectedIds,
    selectedTargets,
    formattedSelectedSize,
    isCleaning,
    reclaimedSummary,
    toggleSelect,
    toggleSelectAll,
    handleClean,
    resetAll,
  };
}
