import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChoiceRow } from './app/components/shared/ChoiceRow';
import { ProjectDependencyGroup } from './app/modules/dependencies/ProjectDependencyGroup';
import { visibleDependencies, type Scope } from './app/utils/dependencies.mjs';
import type { ProjectDependencies } from './app/types/dependencies';
import type { ToolchainReport } from './app/types/toolchains';
import { ToolchainSection } from './app/modules/dependencies/ToolchainSection';

/** The desktop DependenciesModule, reading from props instead of a scan. */
export function DemoDependencies({
  projects,
  toolchains,
}: {
  projects: ProjectDependencies[];
  toolchains: ToolchainReport;
}) {
  const { t } = useTranslation();
  const [scope, setScope] = useState<Scope>('high');

  const visible = useMemo(() => visibleDependencies(projects, scope) as ProjectDependencies[], [projects, scope]);
  const unusedCount = visible.reduce(
    (sum, project) => sum + project.reports.reduce((inner, report) => inner + report.unused.length, 0),
    0,
  );

  return (
    <section aria-label={t('dependencies.module.title')} className="flex h-full w-full flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-forest-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-mist-100 sm:text-3xl">{t('dependencies.module.title')}</h1>
          <span className="inline-flex min-h-8.5 shrink-0 items-center gap-2 rounded-xl bg-sage-400 px-3.5 text-xs font-semibold text-forest-950 shadow-xs">
            <RefreshCw size={13} className="text-forest-950" aria-hidden="true" />
            <span>{t('dependencies.module.readAgain')}</span>
          </span>
        </div>
        <p className="mt-1.5 max-w-2xl text-xs text-mist-500">{t('dependencies.module.intro')}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pe-2 pt-5 pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-mist-300">
            <strong className="font-semibold text-mist-100">{t('dependencies.module.found', { count: unusedCount })}</strong>{' '}
            {unusedCount > 0 && t('dependencies.module.projects', { count: visible.length })}
          </p>
          <ChoiceRow
            active={scope}
            onChange={setScope}
            options={[
              ['high', t('dependencies.scope.high'), t('dependencies.scope.highHint')],
              ['all', t('dependencies.scope.all'), t('dependencies.scope.allHint')],
            ]}
          />
        </div>
        <div className="grid gap-4">
          {visible.map((project) => (
            <ProjectDependencyGroup key={project.project} project={project} />
          ))}
        </div>
        <ToolchainSection report={toolchains} loading={false} failed={false} />
      </div>
    </section>
  );
}
