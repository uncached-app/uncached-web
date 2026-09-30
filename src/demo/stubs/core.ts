/** Stands in for `@tauri-apps/api/core` in the website build: there is no backend. */
export function isTauri(): boolean {
  return false;
}

export function invoke<T>(command: string, _args?: unknown): Promise<T> {
  return Promise.reject({ code: 'internal', message: `${command} is not available in the demo`, params: {} });
}
