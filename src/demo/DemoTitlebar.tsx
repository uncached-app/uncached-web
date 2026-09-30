import { Check, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AppModule } from './app/types/module';
import type { Step } from './app/types/scan';

const STEPS = ['workspace', 'scan', 'review', 'done'] as const;

/** The macOS layout of the desktop Titlebar, without window calls. */
export function DemoTitlebar({
  step,
  reviewing,
  activeModule,
}: {
  step: Step;
  reviewing: boolean;
  activeModule: AppModule;
}) {
  const { t } = useTranslation();
  const reclaiming = activeModule === 'reclaim' && (step === 4 || reviewing);
  const title =
    activeModule === 'insights'
      ? t('shell.titlebar.title.insights')
      : activeModule === 'intelligence'
        ? t('shell.titlebar.title.maintenance')
        : activeModule === 'reclaim'
          ? t('shell.titlebar.title.workspace')
          : 'Uncached';

  return (
    <header className="relative flex h-12 shrink-0 items-center justify-start gap-5 border-b border-forest-800 bg-forest-950 px-4">
      <div className="flex items-center gap-2" aria-hidden="true">
        <span className="traffic-light traffic-light-close" />
        <span className="traffic-light traffic-light-minimize" />
        <span className="traffic-light traffic-light-maximize" />
      </div>
      {reclaiming ? (
        <nav
          aria-label={t('shell.titlebar.pipeline')}
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 text-xs"
        >
          {STEPS.map((stepKey, index) => {
            const stepNumber = (index + 1) as Step;
            const isCurrent = step === stepNumber;
            const isPassed = step > stepNumber;
            return (
              <span
                key={stepKey}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${isCurrent ? 'bg-forest-800 text-sage-300' : isPassed ? 'text-mist-300' : 'text-mist-500'}`}
              >
                <span
                  className={`grid size-4 place-items-center rounded-full font-mono text-[10px] ${isCurrent ? 'bg-sage-400 font-bold text-forest-950' : isPassed ? 'bg-forest-800 text-sage-300' : 'bg-forest-900 text-mist-500'}`}
                >
                  {isPassed ? <Check size={10} strokeWidth={3} /> : stepNumber}
                </span>
                {t(`shell.titlebar.steps.${stepKey}`)}
              </span>
            );
          })}
        </nav>
      ) : (
        <span className="absolute left-1/2 -translate-x-1/2 text-xs font-medium text-mist-500">{title}</span>
      )}
      <span className="ml-auto grid size-7 place-items-center rounded-md bg-forest-800 text-mist-500" aria-hidden="true">
        <Settings size={16} />
      </span>
    </header>
  );
}
