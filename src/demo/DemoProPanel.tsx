import { LockKeyhole } from 'lucide-react';

/** The desktop's Pro panels, with the button leading to the pricing page. */
export function DemoProPanel({ badge, title, body, cta }: { badge: string; title: string; body: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-pro-200/30 bg-pro-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-pro-200/30 bg-forest-950 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-pro-100">
            <LockKeyhole size={11} aria-hidden="true" />
            <span>{badge}</span>
          </div>
          <h2 className="text-base font-semibold text-mist-100">{title}</h2>
          <p className="mt-2 text-xs leading-relaxed text-mist-500">{body}</p>
        </div>
        <a
          href="/pricing"
          className="inline-flex items-center rounded-xl bg-pro-200 px-4 py-2.5 text-xs font-semibold text-forest-950 shadow-sm transition-opacity hover:opacity-90"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}
