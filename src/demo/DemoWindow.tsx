import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompletionView } from './app/components/completion/CompletionView';
import { FindingsSection } from './app/components/findings/FindingsSection';
import { ModuleBar } from './app/components/layout/ModuleBar';
import { ProjectPage } from './app/components/workspace/ProjectPage';
import { WorkspaceMap } from './app/components/workspace/WorkspaceMap';
import type { AppModule } from './app/types/module';
import type { CleanResult, ScanTarget, Step } from './app/types/scan';
import type { Verdict } from './app/types/workspace';
import { DemoDependencies } from './DemoDependencies';
import { DemoInsights } from './DemoInsights';
import { DemoMaintenance } from './DemoMaintenance';
import { DemoTitlebar } from './DemoTitlebar';
import { createDemoData, PROTECTED_PROJECT, SECRETS_PROJECT } from './mock';
import { clearConfetti, setConfettiCanvas } from './stubs/confetti';
import { useTranslation } from 'react-i18next';

export type Scene =
  | 'workspace'
  | 'project'
  | 'secrets'
  | 'review'
  | 'done'
  | 'dependencies'
  | 'maintenance'
  | 'insights';

const NO_RUNNING = {};
const NO_CLEANING = new Set<string>();
const REMOVAL_DELAY_MS = 180;

function moduleOf(scene: Scene): AppModule {
  if (scene === 'dependencies') return 'dependencies';
  if (scene === 'maintenance') return 'intelligence';
  if (scene === 'insights') return 'insights';
  return 'reclaim';
}

const SCENE_OF_MODULE: Partial<Record<AppModule, Scene>> = {
  reclaim: 'workspace',
  dependencies: 'dependencies',
  intelligence: 'maintenance',
  insights: 'insights',
};

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

/**
 * The desktop window, driven by `scene`. Clicks inside navigate through
 * `onNavigate`; `epoch` changing puts every removed folder back.
 */
export function DemoWindow({
  scene,
  epoch,
  onNavigate,
}: {
  scene: Scene;
  epoch: number;
  onNavigate: (scene: Scene) => void;
}) {
  const data = useMemo(() => createDemoData(Math.floor(Date.now() / 1000)), []);
  const [targets, setTargets] = useState<ScanTarget[]>(data.targets);
  const [summary, setSummary] = useState({ removed: 0, freedBytes: 0 });
  const [openPath, setOpenPath] = useState(PROTECTED_PROJECT);
  const [query, setQuery] = useState('');
  const [activeVerdict, setActiveVerdict] = useState<Verdict | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const confettiCanvas = useRef<HTMLCanvasElement>(null);
  const windowRoot = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (scene !== 'done') clearConfetti();
  }, [scene]);

  // The secrets panel sits below the verdict; its chapter scrolls the page to it.
  useEffect(() => {
    if (scene !== 'secrets') return;
    const frame = window.requestAnimationFrame(() => {
      const root = windowRoot.current;
      const title = t('workspace.project.secrets.title');
      const label = Array.from(root?.querySelectorAll('p') ?? []).find((node) => node.textContent === title);
      const scroller = label?.closest('.overflow-y-auto');
      if (!label || !(scroller instanceof HTMLElement)) return;
      const offset = label.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      scroller.scrollTo({ top: scroller.scrollTop + offset - 24, behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [scene, t]);

  useEffect(() => {
    setConfettiCanvas(confettiCanvas.current);
    return () => setConfettiCanvas(null);
  }, []);

  useEffect(() => {
    setTargets(data.targets);
    setSummary({ removed: 0, freedBytes: 0 });
    setOpenPath(PROTECTED_PROJECT);
  }, [data, epoch]);

  const cleanTarget = useCallback(async (targetId: string): Promise<CleanResult | null> => {
    await wait(REMOVAL_DELAY_MS);
    let freedBytes = 0;
    setTargets((current) => {
      freedBytes = current.find((target) => target.id === targetId)?.sizeBytes ?? 0;
      return current.filter((target) => target.id !== targetId);
    });
    setSummary((current) => ({ removed: current.removed + 1, freedBytes: current.freedBytes + freedBytes }));
    return { freedBytes, sizeHasErrors: false, modeUsed: 'Trash' };
  }, []);

  const pagePath = scene === 'secrets' ? SECRETS_PROJECT : openPath;
  const openProject = data.index.projects.find((project) => project.path === pagePath) ?? null;
  const step: Step = scene === 'done' ? 4 : 3;
  const view = scene === 'review' || scene === 'done' ? 'artifacts' : 'projects';

  return (
    <div
      ref={windowRoot}
      className="app-demo relative flex h-full flex-col overflow-hidden rounded-[14px] bg-forest-950 text-mist-100"
    >
      <DemoTitlebar step={step} reviewing={scene === 'review'} activeModule={moduleOf(scene)} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-8 py-5">
          {scene === 'workspace' && (
            <WorkspaceMap
              index={data.index}
              query={query}
              onQueryChange={setQuery}
              proEnabled={false}
              footprints={data.footprints}
              running={NO_RUNNING}
              verdicts={data.verdicts}
              chosenRoots={data.index.roots}
              onAddRoot={() => {}}
              onRemoveRoot={() => {}}
              onRemoveAllRoots={() => {}}
              targetCount={targets.length}
              onReclaim={() => onNavigate('review')}
              change={null}
              reclaimedBytes={null}
              activeVerdict={activeVerdict}
              setActiveVerdict={setActiveVerdict}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              clonesOnly={false}
              setClonesOnly={() => {}}
              activePackage={null}
              setActivePackage={() => {}}
              focusPath={null}
              onFocusHandled={() => {}}
              sidebarHidden={sidebarHidden}
              onSidebarHiddenChange={setSidebarHidden}
              shortcuts={undefined}
              onRescan={() => {}}
              onOpenProject={(path) => {
                setOpenPath(path);
                onNavigate('project');
              }}
            />
          )}

          {(scene === 'project' || scene === 'secrets') && openProject && (
            <ProjectPage
              proEnabled={false}
              project={openProject}
              verdict={data.verdicts[openProject.path] ?? 'unknown'}
              footprint={data.footprints[openProject.path] ?? null}
              running={null}
              targets={targets}
              cleaningTargetIds={NO_CLEANING}
              cleanMode="Trash"
              onClean={async (targetId) => (await cleanTarget(targetId)) !== null}
              packages={[]}
              analysing={false}
              onBack={() => onNavigate('workspace')}
              onShowInList={() => onNavigate('workspace')}
              onOpenProject={(path) => setOpenPath(path)}
              maintenanceExcluded={null}
              onMaintenanceExcludedChange={() => {}}
            />
          )}

          {(scene === 'review' || scene === 'done') && (
            <FindingsSection
              step={step}
              scanning={false}
              cancelling={false}
              targets={targets}
              cleaningTargetIds={NO_CLEANING}
              cleanMode="Trash"
              cancelScan={() => {}}
              onDone={() => onNavigate('done')}
              onBack={() => onNavigate('workspace')}
              cleanTarget={cleanTarget}
              refreshTargetSize={() => {}}
              cleanupModeSupported
              proEnabled={false}
              activeIgnoreRules={0}
              unreadable={0}
              running={NO_RUNNING}
              error={null}
            />
          )}

          <CompletionView
            step={step}
            cleanupSummary={summary.removed > 0 ? summary : { removed: 4, freedBytes: 2.7 * 1024 ** 3 }}
            cleanupMode="Trash"
            resetScan={() => onNavigate('workspace')}
            backToWorkspace={() => onNavigate('workspace')}
          />

          {scene === 'dependencies' && (
            <DemoDependencies projects={data.dependencies} toolchains={data.toolchains} />
          )}

          {scene === 'maintenance' && (
            <DemoMaintenance
              data={data}
              onShowProtected={() => {
                setActiveVerdict('protect');
                onNavigate('workspace');
              }}
            />
          )}

          {scene === 'insights' && <DemoInsights data={data} onOpenWorkspace={() => onNavigate('workspace')} />}
        </div>
        <ModuleBar
          activeModule={moduleOf(scene)}
          onChange={(module) => {
            const next = SCENE_OF_MODULE[module];
            if (next) onNavigate(next);
          }}
          proEnabled={false}
          view={view}
          onViewChange={(next) => onNavigate(next === 'artifacts' ? 'review' : 'workspace')}
        />
      </div>
      <canvas ref={confettiCanvas} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true" />
    </div>
  );
}
