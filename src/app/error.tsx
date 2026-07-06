'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Global error boundary component.
 * Provides graceful crash recovery with a styled error UI when an
 * unhandled exception occurs in a page or layout component.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-8 font-sans"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          Operations Error Detected
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed mb-2">
          An unexpected error occurred within the Pulse Stadium Engine. 
          The operations team has been notified.
        </p>

        {error.digest && (
          <p className="text-xs text-slate-600 font-mono mb-6">
            Error Digest: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold rounded-lg text-sm transition-all shadow-md focus:ring-2 focus:ring-rose-500 focus:outline-none"
          aria-label="Attempt to recover from the error"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Operations
        </button>
      </div>
    </div>
  );
}
