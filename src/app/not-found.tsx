import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';

/**
 * Custom 404 Not Found page.
 * Provides a branded, helpful response when users navigate to an invalid route,
 * with clear navigation links back to valid application sections.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-8 h-8" />
        </div>

        <h1 className="text-5xl font-black text-white mb-2">404</h1>
        <p className="text-lg font-semibold text-slate-400 mb-1">
          Route Not Found
        </p>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          The requested operations endpoint does not exist. 
          Please navigate to one of the valid stadium control panels below.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/operator"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold rounded-lg text-sm transition-all shadow-md"
          >
            Operator Console
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/fan"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold rounded-lg text-sm transition-all"
          >
            Fan Companion
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <a
          href="/"
          className="inline-block mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Return to Launchpad
        </a>
      </div>
    </div>
  );
}
