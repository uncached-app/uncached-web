import { Check } from 'lucide-react';
import { STEPS, type ScanStep } from './scanSimulatorData';

interface ProgressPipelineProps {
  step: ScanStep;
}

export default function ProgressPipeline({ step }: ProgressPipelineProps) {
  return (
    <nav aria-label="Progress pipeline" className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm">
      {STEPS.map((label, index) => {
        const stepNumber = (index + 1) as ScanStep;
        const isCurrent = step === stepNumber;
        const isPassed = step > stepNumber;

        return (
          <span
            key={label}
            aria-current={isCurrent ? 'step' : undefined}
            className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 font-medium transition-colors ${
              isCurrent ? 'bg-raised text-accent' : isPassed ? 'text-text-secondary' : 'text-text-muted'
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
  );
}
