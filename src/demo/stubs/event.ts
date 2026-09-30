/** Stands in for `@tauri-apps/api/event`; nothing is ever emitted. */
export type UnlistenFn = () => void;

export function listen<T>(_event: string, _handler: (event: { payload: T }) => void): Promise<UnlistenFn> {
  return Promise.resolve(() => {});
}
