import { useEffect, useRef, useState } from 'react';
import { DemoWindow, type Scene } from './DemoWindow';
import { initDemoI18n } from './i18n';

initDemoI18n();

type Chapter = { scene: Scene; title: string; body: string };

const CHAPTERS: Chapter[] = [
  {
    scene: 'workspace',
    title: 'Every project, with a verdict',
    body: 'Uncached reads the git state of each project and sorts your workspace by what is safe to clean. Click any project to open it.',
  },
  {
    scene: 'project',
    title: 'Unpushed work is never touched',
    body: 'Uncommitted files, unpushed commits and stashes mark a project Protect. Its page says why, and which command rebuilds the rest.',
  },
  {
    scene: 'secrets',
    title: 'It catches secrets before Git publishes them',
    body: 'Env files, private keys, credentials and registry tokens that are committed or not ignored are flagged on the project, each with the command that stops Git from publishing it.',
  },
  {
    scene: 'review',
    title: 'You pick what goes',
    body: 'Every folder shows its size and why it can be rebuilt. Select a few and press Move to Trash: each one is checked again right before it moves.',
  },
  {
    scene: 'done',
    title: 'It goes to the Trash',
    body: 'Nothing is deleted outright. If a build needs a folder back, put it back from the Trash or run the install command the project page shows.',
  },
  {
    scene: 'dependencies',
    title: 'Unused dependencies, too',
    body: 'Packages in package.json or Cargo.toml that nothing in the project imports, and Node, Rust, Python and Java versions no project uses, each with the command that removes it. Uncached only reports them.',
  },
  {
    scene: 'maintenance',
    title: 'Pro keeps it clean on its own',
    body: 'Set a policy once and Pro cleans the projects you have stopped touching, on a schedule. Free shows what it would take. Try the options.',
  },
  {
    scene: 'insights',
    title: 'And remembers what it freed',
    body: 'Pro records every cleanup, manual or scheduled, and charts it over time. Free still reads your workspace fresh every time you open it.',
  },
];

/** Scenes whose arrival puts the removed folders back. */
const RESETS: ReadonlySet<Scene> = new Set(['workspace', 'review']);

/** A programmatic scroll the user interrupts would otherwise hold the chapter forever. */
const PENDING_TIMEOUT_MS = 1600;

function chapterAt(section: HTMLElement): number {
  const { top, height } = section.getBoundingClientRect();
  const scrollable = Math.max(height - window.innerHeight, 1);
  const progress = Math.min(Math.max(-top / scrollable, 0), 0.9999);
  return Math.floor(progress * CHAPTERS.length);
}

export default function GuidedDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const pendingTimer = useRef(0);
  const [chapter, setChapter] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const [scene, setScene] = useState<Scene>(CHAPTERS[0].scene);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      if (sectionRef.current) setChapter(chapterAt(sectionRef.current));
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(pendingTimer.current);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  // While a jump scrolls past other chapters, their scenes are not shown.
  useEffect(() => {
    if (pending !== null && chapter !== pending) return;
    if (pending !== null) setPending(null);
    const next = CHAPTERS[chapter].scene;
    setScene(next);
    if (RESETS.has(next)) setEpoch((current) => current + 1);
  }, [chapter, pending]);

  function jumpTo(index: number) {
    const section = sectionRef.current;
    if (!section || index === chapter) return;
    setPending(index);
    window.clearTimeout(pendingTimer.current);
    pendingTimer.current = window.setTimeout(() => setPending(null), PENDING_TIMEOUT_MS);
    const scrollable = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((index + 0.5) / CHAPTERS.length) * scrollable, behavior: 'smooth' });
  }

  function navigate(next: Scene) {
    setScene(next);
    const index = CHAPTERS.findIndex((entry) => entry.scene === next);
    if (index >= 0) jumpTo(index);
  }

  const shown = pending ?? chapter;
  const current = CHAPTERS[shown];

  return (
    <section ref={sectionRef} aria-label="Uncached, step by step" style={{ height: `${CHAPTERS.length * 90}vh` }}>
      <div className="container sticky top-0 flex h-screen flex-col justify-center gap-6 py-8">
        <div key={current.scene} className="ui-fade min-h-[8.5rem] max-w-2xl" aria-live="polite">
          <h2 className="text-3xl font-bold tracking-[-0.04em] text-text-primary">{current.title}</h2>
          <p className="mt-3 text-pretty text-base leading-7 text-text-secondary">{current.body}</p>
        </div>
        <div className="h-[min(760px,calc(100vh-16rem))] rounded-[14px] shadow-[0_24px_60px_-12px_rgb(0_0_0/0.35)] ring-1 ring-border-theme">
          <DemoWindow scene={scene} epoch={epoch} onNavigate={navigate} />
        </div>
      </div>
    </section>
  );
}
