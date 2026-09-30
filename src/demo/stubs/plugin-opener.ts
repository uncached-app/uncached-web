/** Stands in for `@tauri-apps/plugin-opener`. */
export function openUrl(url: string): Promise<void> {
  window.open(url, '_blank', 'noopener');
  return Promise.resolve();
}
