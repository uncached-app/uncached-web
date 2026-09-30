import type { MaintenancePolicy, MaintenancePreview, Selected, Skipped } from './app/types/maintenance';
import type { Footprint, Verdict, WorkspaceProject } from './app/types/workspace';

/**
 * Port of `select` in uncached-desktop/src-tauri/src/workspace/maintenance.rs,
 * which the app asks over IPC. Only `safe` allows automation there.
 */
export function previewMaintenance(
  projects: WorkspaceProject[],
  footprints: Record<string, Footprint>,
  verdicts: Record<string, Verdict>,
  policy: MaintenancePolicy,
): MaintenancePreview {
  const selected: Selected[] = [];
  const skipped: Skipped[] = [];

  for (const project of projects) {
    const verdict = verdicts[project.path] ?? 'unknown';
    const bytes = footprints[project.path]?.reclaimableBytes ?? null;
    const idleDays = project.activity.idleDays;
    const skip = (reason: Skipped['reason']) =>
      skipped.push({ path: project.path, name: project.name, reason, verdict });

    if (policy.excluded.includes(project.path)) skip('excluded');
    else if (verdict !== 'safe') skip('verdict');
    else if (bytes === null) skip('unmeasured');
    else if (idleDays === null) skip('unknownActivity');
    else if (idleDays < policy.minIdleDays) skip('tooRecent');
    else if (bytes < policy.minBytes) skip('tooSmall');
    else selected.push({ path: project.path, name: project.name, bytes, idleDays });
  }

  selected.sort((left, right) => right.bytes - left.bytes);

  return {
    selected,
    skipped,
    bytes: selected.reduce((total, entry) => total + entry.bytes, 0),
    protectedCount: skipped.filter((entry) => entry.verdict === 'protect').length,
  };
}
