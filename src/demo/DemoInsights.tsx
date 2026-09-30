import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Highlights } from './app/modules/insights/Highlights';
import { Portrait } from './app/modules/insights/Portrait';
import { Summary } from './app/modules/insights/Summary';
import { Timeline } from './app/modules/insights/Timeline';
import { formatBytes } from './app/utils/format.mjs';
import { buildInsights, type Insight } from './app/utils/insights.mjs';
import { workspacePortrait, type Portrait as PortraitData } from './app/utils/portrait.mjs';
import { buildReport, type Report } from './app/utils/report.mjs';
import { DemoProPanel } from './DemoProPanel';
import type { DemoData } from './mock';

/**
 * The desktop InsightsModule on Free, with the history Pro keeps drawn from
 * sample cleanups underneath the offer.
 */
export function DemoInsights({ data, onOpenWorkspace }: { data: DemoData; onOpenWorkspace: () => void }) {
  const { t } = useTranslation();
  const [grain, setGrain] = useState('week');
  const { projects } = data.index;

  const report = useMemo(() => buildReport({ events: data.history, grain }) as Report, [data, grain]);
  const portrait = useMemo(
    () => workspacePortrait({ projects, footprints: data.footprints, verdicts: data.verdicts }) as PortraitData,
    [data, projects],
  );
  const insights = useMemo(
    () =>
      buildInsights({
        projects,
        footprints: data.footprints,
        verdicts: data.verdicts,
        totals: null,
        formatBytes,
      }) as Insight[],
    [data, projects],
  );

  return (
    <section aria-label={t('insights.module.title')} className="flex h-full w-full flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-forest-800 pb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-mist-100 sm:text-3xl">{t('insights.module.title')}</h1>
          <span className="rounded-lg border border-forest-800 bg-forest-900 px-2.5 py-0.5 font-mono text-xs font-medium text-sage-300">
            {t('insights.module.badge.free')}
          </span>
        </div>
        <p className="mt-1.5 max-w-2xl text-xs text-mist-500">{t('insights.module.intro.free')}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pe-2 pt-5 pb-8">
        <div className="mb-4">
          <DemoProPanel
            badge={t('insights.pro.badge')}
            title={t('insights.pro.title')}
            body={t('insights.pro.body')}
            cta={t('insights.pro.cta')}
          />
        </div>
        <div className="mb-4 grid gap-4" aria-label="Sample Pro history">
          <Summary report={report} />
          <Timeline report={report} onGrain={setGrain} />
        </div>
        <div className="mb-4">
          <Portrait portrait={portrait} onOpenWorkspace={onOpenWorkspace} />
        </div>
        <Highlights insights={insights} projectCount={projects.length} onFollow={onOpenWorkspace} />
      </div>
    </section>
  );
}
