import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard } from './app/components/shared/StatCard';
import { PolicyCard } from './app/modules/maintenance/PolicyCard';
import { Selection } from './app/modules/maintenance/Selection';
import { DEFAULT_POLICY, type MaintenancePolicy } from './app/types/maintenance';
import { formatBytes } from './app/utils/format.mjs';
import { DemoProPanel } from './DemoProPanel';
import { previewMaintenance } from './maintenancePreview';
import type { DemoData } from './mock';

const IDLE = { kind: 'idle' } as const;

/** The Free layout of the desktop IntelligenceModule: the policy and what it would take. */
export function DemoMaintenance({ data, onShowProtected }: { data: DemoData; onShowProtected: () => void }) {
  const { t } = useTranslation();
  const [policy, setPolicy] = useState<MaintenancePolicy>(DEFAULT_POLICY);
  const preview = useMemo(
    () => previewMaintenance(data.index.projects, data.footprints, data.verdicts, policy),
    [data, policy],
  );

  return (
    <section aria-label={t('maintenance.header.title')} className="flex h-full w-full flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-forest-800 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-mist-100 sm:text-3xl">{t('maintenance.header.title')}</h1>
              <span className="rounded-lg border border-forest-800 bg-forest-900 px-2.5 py-0.5 font-mono text-xs font-semibold text-sage-300">
                {t('maintenance.header.badgeFree')}
              </span>
            </div>
            <p className="mt-1 text-xs text-mist-500">{t('maintenance.header.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatCard
              value={`${preview.selected.length}`}
              label={
                preview.selected.length === 0
                  ? t('maintenance.header.eligibleNone')
                  : t('maintenance.header.eligible', { count: preview.selected.length })
              }
            />
            <StatCard value={formatBytes(preview.bytes)} label={t('maintenance.header.reclaimable')} accent={preview.bytes > 0} />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pe-2 pt-5 pb-8">
        <div className="grid gap-4">
          <DemoProPanel
            badge={t('maintenance.states.pro.badge')}
            title={t('maintenance.states.pro.title')}
            body={t('maintenance.states.pro.body')}
            cta={t('maintenance.states.pro.cta')}
          />
          <PolicyCard policy={policy} onChange={setPolicy} matchCount={preview.selected.length} matchBytes={preview.bytes} />
          <Selection
            preview={preview}
            proEnabled={false}
            canRun={false}
            run={IDLE}
            onRun={() => {}}
            onShowProtected={onShowProtected}
          />
        </div>
      </div>
    </section>
  );
}
