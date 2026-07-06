import React from 'react';
import { Shield, Users, ArrowRight, Activity, Server } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-rose-900/15 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Main Core Navigation Landing */}
      <main className="max-w-4xl w-full mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center text-center relative z-10">
        
        {/* FIFA WC 2026 Badge logo */}
        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs text-rose-400 font-semibold mb-6">
          <Activity className="w-3.5 h-3.5 animate-pulse text-rose-500" />
          <span>FIFA World Cup 2026 Stadium Operations</span>
        </div>

        {/* Hero title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          PULSE <span className="bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 bg-clip-text text-transparent">AI ENGINE</span>
        </h1>
        
        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
          Pulse is a GenAI-enabled stadium operations orchestration platform. Evaluate venue telemetry in real time, apply automated Venue SOP rules via Gemini AI, and instantly broadcast redirection messages to fans.
        </p>

        {/* Side-by-Side Launcher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-12">
          
          {/* Card 1: Staff operations console */}
          <a 
            href="/operator"
            className="group flex flex-col justify-between text-left p-6 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] relative overflow-hidden"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                Staff Operations Console
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-transform group-hover:translate-x-1" />
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simulate gate telemetry, inspect active security alerts, examine Gemini-driven SOP analysis, and approve fan redirection notifications.
              </p>
            </div>
            <div className="mt-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              /operator VIEW →
            </div>
          </a>

          {/* Card 2: Fan mobile view */}
          <a 
            href="/fan"
            className="group flex flex-col justify-between text-left p-6 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                Fan Mobile Companion
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                A mobile companion styled within an iPhone wrapper. Automatically polls for operator-approved redirects with bilingual English/Spanish messaging and metadata.
              </p>
            </div>
            <div className="mt-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              /fan VIEW →
            </div>
          </a>

        </div>

        {/* Architecture details list */}
        <div className="border border-slate-900 bg-slate-900/20 rounded-xl p-4 max-w-lg w-full flex items-start gap-3 text-left">
          <Server className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-slate-300 block mb-0.5">Secure Dual-Payload Pipeline</span>
            Evaluates gate capacity overflow and weather threats via server-side Gemini 1.5 JSON API schema mapping, protecting API credentials.
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 p-6 text-center text-xs text-slate-600">
        Pulse AI Stadium Orchestration Platform • FIFA World Cup 2026 Local Host Console
      </footer>

    </div>
  );
}
