import { useEffect, useState, type FormEvent } from 'react';

const STORAGE_KEY = 'uncached_windows_waitlist';

type Status = 'idle' | 'sending' | 'joined' | 'failed';

/** Email signup for the Windows release. Posts to /api/whitelist with os "Windows". */
export default function WindowsWaitlist() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [joinedAs, setJoinedAs] = useState<string | null>(null);

  useEffect(() => {
    try {
      setJoinedAs(localStorage.getItem(STORAGE_KEY));
    } catch {
      setJoinedAs(null);
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || status === 'sending') return;
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), os: 'Windows' }),
      });
      const data = (await response.json()) as { success: boolean; message?: string };
      if (!data.success) {
        setStatus('failed');
        setMessage(data.message ?? 'That did not go through. Try again.');
        return;
      }
      setStatus('joined');
      setJoinedAs(email.trim());
      try {
        localStorage.setItem(STORAGE_KEY, email.trim());
      } catch {
        // Storage blocked: the confirmation on screen is enough.
      }
    } catch {
      setStatus('failed');
      setMessage('Could not reach the server. Try again shortly.');
    }
  }

  if (joinedAs) {
    return (
      <p className="font-mono text-xs text-accent-ink" role="status">
        {joinedAs} is on the list. One email when Windows ships.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="windows-waitlist-email">
        Email for the Windows release
      </label>
      <input
        id="windows-waitlist-email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
        className="h-10 min-w-0 flex-1 rounded-xl border border-border-theme bg-raised px-3.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="h-10 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {status === 'sending' ? 'Joining…' : 'Notify me'}
      </button>
      {status === 'failed' && (
        <p role="alert" className="text-xs text-destructive sm:basis-full">
          {message}
        </p>
      )}
    </form>
  );
}
