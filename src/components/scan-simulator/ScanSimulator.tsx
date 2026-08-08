import { AnimatePresence, motion } from 'motion/react';
import ProgressPipeline from './ProgressPipeline';
import ReclaimedStep from './ReclaimedStep';
import ReviewStep from './ReviewStep';
import ScanningStep from './ScanningStep';
import useScanSimulator from './useScanSimulator';
import WorkspaceStep from './WorkspaceStep';

export default function ScanSimulator() {
  const simulator = useScanSimulator();

  return (
    <div
      className="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto rounded-2xl sm:rounded-3xl bg-surface border border-border-theme p-4 sm:p-8 overflow-hidden min-h-110 sm:h-120 md:h-156 flex flex-col justify-between select-none text-text-primary transition-colors"
    >
      <div className="flex items-center justify-center pb-3 sm:pb-4 shrink-0 border-b border-border-theme">
        <ProgressPipeline step={simulator.step} />
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden py-3 sm:py-4">
        <AnimatePresence mode="wait">
          {simulator.step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex justify-center"
            >
              <WorkspaceStep
                rootPath={simulator.rootPath}
                onRootPathChange={simulator.setRootPath}
                onScan={() => simulator.setStep(2)}
              />
            </motion.div>
          )}
          {simulator.step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <ScanningStep
                rootPath={simulator.rootPath}
                dirCount={simulator.dirCount}
                onCancel={() => simulator.setStep(1)}
              />
            </motion.div>
          )}
          {simulator.step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <ReviewStep
                selectedIds={simulator.selectedIds}
                selectedTargets={simulator.selectedTargets}
                formattedSelectedSize={simulator.formattedSelectedSize}
                isCleaning={simulator.isCleaning}
                onToggle={simulator.toggleSelect}
                onToggleAll={simulator.toggleSelectAll}
                onClean={simulator.handleClean}
              />
            </motion.div>
          )}
          {simulator.step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <ReclaimedStep
                count={simulator.reclaimedSummary.count}
                size={simulator.reclaimedSummary.size}
                onReset={simulator.resetAll}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
