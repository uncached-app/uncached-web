/** Stands in for `@tauri-apps/plugin-dialog`; the demo never opens a picker. */
export function open(_options?: unknown): Promise<null> {
  return Promise.resolve(null);
}
