'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  MapPin, 
  RefreshCw, 
  Clock, 
  Compass, 
  Wifi, 
  ChevronRight
} from 'lucide-react';
import { Incident } from '@/types';
import { POLLING_INTERVAL_MS } from '@/lib/constants';

// ─── Theme Configuration Helper ───────────────────────────────────────────────

/** Returns Tailwind class maps based on the fan payload theme color. */
function getThemeConfig(color: string) {
  switch (color) {
    case 'red':
      return {
        bg: 'bg-red-500/10 border-red-500/30 text-red-200',
        accent: 'bg-red-600 text-white',
        border: 'border-red-500/40',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        badgeText: 'text-red-400',
        iconColor: 'text-red-400',
        bgHeader: 'from-red-950/60 to-slate-900/50'
      };
    case 'yellow':
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
        accent: 'bg-amber-500 text-slate-950',
        border: 'border-amber-500/40',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
        badgeText: 'text-amber-400',
        iconColor: 'text-amber-400',
        bgHeader: 'from-amber-950/30 to-slate-900/50'
      };
    default:
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
        accent: 'bg-emerald-600 text-white',
        border: 'border-emerald-500/40',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        badgeText: 'text-emerald-400',
        iconColor: 'text-emerald-400',
        bgHeader: 'from-emerald-950/30 to-slate-900/50'
      };
  }
}

// ─── Memoized Alert Icon Component ─────────────────────────────────────────────

/** Renders the appropriate Lucide icon based on the alert metadata. */
const AlertIcon = memo(function AlertIcon({ iconName }: { iconName: string }) {
  const size = "w-5 h-5";
  switch (iconName) {
    case 'alert':
      return <AlertCircle className={`${size} text-red-400`} aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle className={`${size} text-amber-400`} aria-hidden="true" />;
    default:
      return <Info className={`${size} text-emerald-400`} aria-hidden="true" />;
  }
});

// ─── Memoized Active Alert Card ────────────────────────────────────────────────

interface ActiveAlertProps {
  redirect: Incident;
  language: 'EN' | 'ES';
}

/** Renders the active redirect alert card with bilingual messaging. */
const ActiveAlertCard = memo(function ActiveAlertCard({ redirect, language }: ActiveAlertProps) {
  const theme = useMemo(() => getThemeConfig(redirect.fanPayload.themeColor), [redirect.fanPayload.themeColor]);
  const isEn = language === 'EN';

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Alert Message Card */}
      <article 
        className={`border rounded-2xl p-4 flex flex-col gap-3.5 bg-gradient-to-b ${theme.bgHeader} to-slate-900 ${theme.border} ${theme.glow}`}
        aria-labelledby="alert-card-heading"
        role="alert"
        aria-live="assertive"
      >
        
        {/* Header Info details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertIcon iconName={redirect.fanPayload.alertIcon} />
            <span className={`text-[10px] font-bold tracking-wider uppercase ${theme.badgeText}`}>
              {isEn ? 'VENUE NOTICE' : 'AVISO DEL ESTADIO'}
            </span>
          </div>
          
          {redirect.fanPayload.estimatedDelayMinutes > 0 && (
            <div className="flex items-center gap-1 bg-slate-950/40 px-2 py-0.5 rounded text-[10px] text-slate-400 font-medium">
              <Clock className="w-3 h-3 text-slate-500" aria-hidden="true" />
              <span>{redirect.fanPayload.estimatedDelayMinutes} min {isEn ? 'delay' : 'demora'}</span>
            </div>
          )}
        </div>

        {/* Empathetic Instruction Message */}
        <div className="text-slate-200 text-xs font-semibold leading-relaxed">
          <h3 id="alert-card-heading" className="sr-only">
            {isEn ? 'Venue Notification Redirect Card' : 'Tarjeta de Redirección del Estadio'}
          </h3>
          <p className="whitespace-pre-wrap">
            {isEn ? redirect.fanPayload.englishMessage : redirect.fanPayload.spanishMessage}
          </p>
        </div>

        {/* Redirect Map / Action Box */}
        {redirect.fanPayload.redirectGate && (
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${theme.accent}`}>
                <MapPin className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {isEn ? 'USE ALTERNATIVE' : 'USAR ENTRADA ALTERNA'}
                </div>
                <div className="text-xs font-extrabold text-white">
                  {redirect.fanPayload.redirectGate}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" aria-hidden="true" />
          </div>
        )}
      </article>

      {/* Operational Directions Mock Map graphic */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {isEn ? 'Stadium Access Map' : 'Mapa de Accesos al Estadio'}
        </h4>
        
        {/* Simulated SVG Map */}
        <div 
          className="h-32 bg-slate-950 rounded-lg relative overflow-hidden border border-slate-800/60 flex items-center justify-center"
          role="img"
          aria-label={isEn 
            ? `Stadium map showing ${redirect.telemetry.gateId} is congested${redirect.fanPayload.redirectGate ? ` and ${redirect.fanPayload.redirectGate} is available` : ''}`
            : `Mapa del estadio mostrando que ${redirect.telemetry.gateId} está congestionada${redirect.fanPayload.redirectGate ? ` y ${redirect.fanPayload.redirectGate} está disponible` : ''}`
          }
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          {/* Stadium Circle */}
          <div className="w-20 h-20 rounded-full border-2 border-slate-800 flex items-center justify-center text-[10px] font-extrabold text-slate-600 relative bg-slate-900">
            {isEn ? 'STADIUM' : 'ESTADIO'}
            
            {/* Interactive gate status dots */}
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
            <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
          </div>

          {/* Overloaded Gate indicator */}
          <div className="absolute top-8 left-12 flex flex-col items-center">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute" aria-hidden="true"></span>
            <span className="w-3 h-3 rounded-full bg-red-500 relative" aria-hidden="true"></span>
            <span className="text-[9px] text-red-400 font-bold mt-1 font-mono">{redirect.telemetry.gateId}</span>
          </div>

          {/* Redirect route helper */}
          {redirect.fanPayload.redirectGate && (
            <div className="absolute bottom-6 right-10 flex flex-col items-center">
              <span className="w-3 h-3 rounded-full bg-emerald-400 relative" aria-hidden="true"></span>
              <span className="text-[9px] text-emerald-400 font-bold mt-1 font-mono">{redirect.fanPayload.redirectGate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Gate Entry Speed List ─────────────────────────────────────────────────────

const GATE_ENTRIES = [
  { name: 'Gate A', direction: 'North' },
  { name: 'Gate B', direction: 'East' },
  { name: 'Gate C', direction: 'South' },
  { name: 'Gate D', direction: 'West' },
];

// ─── Main Fan Mobile View ──────────────────────────────────────────────────────

export default function FanMobileView() {
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<'EN' | 'ES'>('EN');
  const [latestRedirect, setLatestRedirect] = useState<Incident | null>(null);

  /** Fetches approved incidents from the API with AbortController support. */
  const fetchApprovedRedirects = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/incidents', { signal });
      if (res.ok) {
        const data: Incident[] = await res.json();
        const approved = data.filter((inc) => inc.status === 'approved');
        
        if (approved.length > 0) {
          setLatestRedirect(approved[0]);
        } else {
          setLatestRedirect(null);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Error fetching approved redirects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Visibility-Aware Polling ──────────────────────────────────────────────

  useEffect(() => {
    const controller = new AbortController();
    fetchApprovedRedirects(controller.signal);

    let intervalId: ReturnType<typeof setInterval>;

    const startPolling = () => {
      intervalId = setInterval(() => {
        fetchApprovedRedirects();
      }, POLLING_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        fetchApprovedRedirects();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      controller.abort();
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchApprovedRedirects]);

  // ─── Stable Callbacks ────────────────────────────────────────────────────────

  const setEnglish = useCallback(() => setLanguage('EN'), []);
  const setSpanish = useCallback(() => setLanguage('ES'), []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      
      {/* Backlink Helper for Testing convenience */}
      <nav className="absolute top-4 left-4 z-50 flex items-center gap-2" aria-label="Navigation">
        <a 
          href="/operator" 
          className="text-xs px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all font-semibold flex items-center gap-1 text-slate-400 hover:text-white"
        >
          <Compass className="w-3.5 h-3.5" aria-hidden="true" />
          Operator Console
        </a>
      </nav>

      {/* Outer iPhone Simulator Frame */}
      <div 
        className="relative w-full max-w-[390px] h-[780px] bg-slate-900 border-[8px] border-slate-800 rounded-[50px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between"
        role="region"
        aria-label="Fan mobile companion simulation"
      >
        
        {/* iPhone Dynamic Island Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-center" aria-hidden="true">
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full ml-12"></div>
        </div>

        {/* Simulated iOS Status Bar */}
        <div className="h-10 px-6 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-semibold z-40 select-none bg-slate-900/90" aria-hidden="true">
          <span>9:41 AM</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-emerald-400">5G</span>
            <div className="w-5 h-2.5 border border-slate-500 rounded-sm p-[1px] flex items-center">
              <div className="h-full w-4 bg-slate-300 rounded-xs"></div>
            </div>
          </div>
        </div>

        {/* Simulated Phone Screen Content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-slate-950 flex flex-col relative px-4 pb-8 custom-scrollbar" role="main">
          
          {/* Fan Header / Brand Area */}
          <div className="pt-4 pb-3 flex items-center justify-between border-b border-slate-900 mb-4 sticky top-0 bg-slate-950/80 backdrop-blur-md z-30">
            <div>
              <div className="text-[9px] bg-red-600 font-bold px-1.5 py-0.5 rounded text-white inline-block tracking-wider uppercase mb-1">
                FIFA 2026
              </div>
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                PULSE COMPANION
              </h1>
            </div>
            
            {/* Language Toggle Selector */}
            <fieldset className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800" role="radiogroup" aria-label="Language selection">
              <legend className="sr-only">Select language</legend>
              <button
                onClick={setEnglish}
                className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all ${
                  language === 'EN' 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-label="English"
                role="radio"
                aria-checked={language === 'EN'}
              >
                EN
              </button>
              <button
                onClick={setSpanish}
                className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all ${
                  language === 'ES' 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-label="Español"
                role="radio"
                aria-checked={language === 'ES'}
              >
                ES
              </button>
            </fieldset>
          </div>

          {/* Connection banner */}
          <div className="mb-4 bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-lg flex items-center justify-between text-[10px]" role="status">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" aria-hidden="true"></span>
              {language === 'EN' ? 'Live Redirect Feed' : 'Feed en Vivo'}
            </span>
            <span className="text-slate-600 font-mono" aria-label="Polling is active">
              {language === 'EN' ? 'polling active' : 'actualizando'}
            </span>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 gap-2" role="status" aria-busy="true">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-500" aria-hidden="true" />
              <span className="text-xs">{language === 'EN' ? 'Loading venue updates...' : 'Cargando actualizaciones...'}</span>
            </div>
          ) : latestRedirect ? (
            <ActiveAlertCard redirect={latestRedirect} language={language} />
          ) : (
            // Default Welcome View (Nominal flow status, no active redirects)
            <div className="flex-1 flex flex-col justify-between py-6">
              
              {/* General stadium operations status */}
              <div className="space-y-4">
                
                {/* Welcome Card banner */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-600/10 to-transparent rounded-full" aria-hidden="true"></div>
                  
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <Compass className="w-6 h-6" aria-hidden="true" />
                  </div>
                  
                  <h2 className="text-sm font-bold text-white">
                    {language === 'EN' ? 'Stadium Flow Nominal' : 'Flujo del Estadio Nominal'}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {language === 'EN' 
                      ? 'Welcome to the FIFA World Cup 2026! Currently, all entry gates are operating normally with standard wait times.'
                      : '¡Bienvenidos a la Copa Mundial de la FIFA 2026! Actualmente, todas las entradas funcionan con normalidad.'}
                  </p>
                </div>

                {/* Gate guide listing */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    {language === 'EN' ? 'Gate Entry Speeds' : 'Velocidad de Ingreso'}
                  </h3>

                  <ul className="space-y-2.5 text-xs" aria-label={language === 'EN' ? 'Gate entry speeds' : 'Velocidades de ingreso'}>
                    {GATE_ENTRIES.map((gate) => (
                      <li key={gate.name} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800/40">
                        <span className="font-semibold text-slate-300">{gate.name} ({gate.direction})</span>
                        <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-800/30 rounded text-[10px] font-bold font-mono">
                          {language === 'EN' ? 'FAST' : 'RÁPIDO'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tips & Assistance */}
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-900 text-[10px] text-slate-500 leading-relaxed mt-4" role="note">
                <span className="font-bold text-slate-400 block mb-0.5">
                  {language === 'EN' ? 'ℹ️ FIFA Fan Tips:' : 'ℹ️ Consejos FIFA:'}
                </span>
                {language === 'EN'
                  ? 'Keep your ticket barcodes open, have your bags prepared for inspection, and obey security guards\' directions.'
                  : 'Tenga su código de barras del boleto listo, prepare su equipaje para inspección y siga las indicaciones del personal de seguridad.'}
              </div>
            </div>
          )}

        </main>

        {/* Simulated iOS Home Grab Bar */}
        <div className="h-6 bg-slate-900 flex items-center justify-center select-none pb-2 z-40" aria-hidden="true">
          <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
        </div>
      </div>
      
      {/* Bottom info */}
      <p className="text-[11px] text-slate-500 mt-4 text-center max-w-[280px]">
        This simulation mimics a mobile phone app using real-time mock data. Approve telemetry from the <a href="/operator" className="underline hover:text-white transition-colors">Operator Console</a> to see shifts.
      </p>

    </div>
  );
}
