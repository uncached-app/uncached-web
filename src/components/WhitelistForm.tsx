import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'uncached_whitelisted_email';

export default function WhitelistForm() {
  const [email, setEmail] = useState('');
  const [os, setOs] = useState('macOS');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedEmail(stored);
      }
    } catch (e) {
      // Storage access may be restricted
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, os }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Added to whitelist.');
        setSavedEmail(email);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, email);
        } catch (e) {
          // ignore
        }
      } else {
        setStatus('error');
        setMessage(data.message || 'Error processing request.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to connect to backend.');
    }
  };

  if (savedEmail) {
    return (
      <div id="whitelist" className="w-full max-w-lg mx-auto scroll-mt-[22vh] px-1 text-center font-mono text-xs sm:text-sm text-accent py-3">
        Early access is reserved for {savedEmail}.
      </div>
    );
  }

  return (
    <div id="whitelist" className="w-full max-w-lg mx-auto scroll-mt-[22vh] px-1">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
        {/* OS Selection Pills */}
        <div className="flex items-center justify-center gap-2 mb-1">
          {['macOS', 'Windows', 'Linux'].map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => setOs(platform)}
              className={`px-3 py-1 text-[11px] sm:text-xs font-mono rounded-full border transition-all cursor-pointer ${
                os === platform
                  ? 'bg-raised text-accent border-accent'
                  : 'bg-surface text-text-muted border-border-theme hover:text-text-secondary'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>

        {/* Input & Submit Row */}
        <div className="relative flex items-center w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@workspace.dev"
            disabled={status === 'loading' || status === 'success'}
            required
            className="w-full px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-xl bg-surface text-text-primary placeholder:text-text-muted border border-border-theme focus:outline-none focus:border-accent font-mono text-xs sm:text-sm pr-28 sm:pr-36 transition-all"
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="absolute right-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-accent hover:bg-accent-hover text-accent-text font-semibold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {status === 'loading' ? 'Joining...' : 'Get early access'}
          </button>
        </div>

        {/* Status Message Animation */}
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-xs text-center font-mono ${
                status === 'success' ? 'text-accent' : 'text-destructive'
              }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
