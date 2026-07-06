'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Activity, 
  AlertCircle, 
  Check, 
  FileText, 
  Play, 
  RefreshCw, 
  Users, 
  Wifi, 
  Wind,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Incident, TelemetryInput } from '@/types';
import { POLLING_INTERVAL_MS } from '@/lib/constants';

// ─── Memoized Sub-Components ───────────────────────────────────────────────────

/** Props for the IncidentCard component. */
interface IncidentCardProps {
  incident: Incident;
  onApprove: (id: string, gate: string) => void;
}

/**
 * Renders a single incident card in the operations decision feed.
 * Wrapped in React.memo to skip re-rendering when the incident data
 * and approval handler reference have not changed.
 */
const IncidentCard = memo(function IncidentCard({ incident, onApprove }: IncidentCardProps) {
  const severityStyle = getSeverityStyles(incident.staffPayload.severity);

  return (
    <article 
      className={`p-4 rounded-xl border ${severityStyle.border} ${severityStyle.bg} transition-all duration-300 flex flex-col gap-3.5 animate-slide-up`}
      aria-labelledby={`incident-heading-${incident.id}`}
    >
      {/* Alert Card Header */}
      <header className="flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${severityStyle.badge}`}>
              {incident.staffPayload.severity}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">
              SOP: {incident.staffPayload.sopCited}
            </span>
          </div>
          <h3 id={`incident-heading-${incident.id}`} className="text-sm font-bold text-slate-100 mt-1.5 flex items-center gap-2">
            {incident.telemetry.gateId} Telemetry Report
          </h3>
        </div>
        <time className="text-[10px] text-slate-500 font-mono" dateTime={incident.timestamp}>
          {new Date(incident.timestamp).toLocaleTimeString()}
        </time>
      </header>

      {/* Dispatched Inputs Summary */}
      <div className="bg-black/35 rounded-lg p-2.5 text-xs grid grid-cols-2 gap-2 text-slate-400 font-mono border border-slate-800/40">
        <div>Flow Load: <span className="font-semibold text-slate-200">{incident.telemetry.gateFlowRate}%</span></div>
        <div>Weather: <span className="font-semibold text-slate-200">{incident.telemetry.weatherCondition}</span></div>
        {incident.telemetry.incidentReport && (
          <div className="col-span-2 mt-1 border-t border-slate-800/40 pt-1 text-[11px] truncate">
            Report: <span className="text-slate-300 italic">&quot;{incident.telemetry.incidentReport}&quot;</span>
          </div>
        )}
      </div>

      {/* Staff Specific Recommendation */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Staff Recommendation &amp; Action
        </h4>
        <p className="text-xs text-slate-200 mt-1 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
          {incident.staffPayload.recommendation}
        </p>
      </div>

      {/* Fan Dual-Message Translation Preview */}
      <div className="border-t border-slate-800/60 pt-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
          <span>Fan Broadcast Preview</span>
          <span className="text-[9px] text-slate-600 lowercase font-normal">(English / Spanish)</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800/60 relative">
            <span className="absolute top-1 right-2 text-[9px] text-slate-600 font-bold uppercase" aria-hidden="true">EN</span>
            <p className="pr-6 font-medium italic"><span className="sr-only">English: </span>&quot;{incident.fanPayload.englishMessage}&quot;</p>
          </div>
          
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800/60 relative">
            <span className="absolute top-1 right-2 text-[9px] text-slate-600 font-bold uppercase" aria-hidden="true">ES</span>
            <p className="pr-6 font-medium italic"><span className="sr-only">Spanish: </span>&quot;{incident.fanPayload.spanishMessage}&quot;</p>
          </div>
        </div>

        {/* Metadata tags */}
        <div className="flex flex-wrap gap-2 mt-2" role="list" aria-label="Incident metadata">
          <span role="listitem" className="text-[9px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-500 border border-slate-800">
            Theme: {incident.fanPayload.themeColor}
          </span>
          <span role="listitem" className="text-[9px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-500 border border-slate-800">
            Icon: {incident.fanPayload.alertIcon}
          </span>
          <span role="listitem" className="text-[9px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-500 border border-slate-800">
            Delay: {incident.fanPayload.estimatedDelayMinutes} mins
          </span>
          {incident.fanPayload.redirectGate && (
            <span role="listitem" className="text-[9px] font-mono bg-yellow-950/20 px-2 py-0.5 rounded text-yellow-500 border border-yellow-800/30 font-semibold">
              Redirect: {incident.fanPayload.redirectGate}
            </span>
          )}
        </div>
      </div>

      {/* Approval Broadcast Area */}
      <footer className="border-t border-slate-800/60 pt-3 flex justify-end">
        {incident.status === 'approved' ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-800/60 px-3 py-1.5 rounded-lg font-semibold" role="status">
            <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Broadcast Active on Fan Mobile
          </div>
        ) : (
          <button
            onClick={() => onApprove(incident.id, incident.telemetry.gateId)}
            className="bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs py-1.5 px-4 rounded-lg transition-all shadow-md flex items-center gap-1.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            aria-label={`Approve operations broadcast to fan view for ${incident.telemetry.gateId}`}
          >
            <span>Approve for Fan Broadcast</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </footer>
    </article>
  );
});

// ─── Severity Style Helper ─────────────────────────────────────────────────────

/** Returns Tailwind class maps for the given severity level. */
function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-950/40',
        text: 'text-red-400',
        border: 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
        badge: 'bg-red-500 text-white animate-pulse'
      };
    case 'WARNING':
      return {
        bg: 'bg-yellow-950/20',
        text: 'text-yellow-400',
        border: 'border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.15)]',
        badge: 'bg-yellow-500 text-slate-950'
      };
    default:
      return {
        bg: 'bg-slate-900/60',
        text: 'text-emerald-400',
        border: 'border-slate-800',
        badge: 'bg-emerald-500 text-slate-950'
      };
  }
}

// ─── SOP Preset Definitions ────────────────────────────────────────────────────

interface SOPPreset {
  key: string;
  code: string;
  label: string;
  codeColor: string;
  gateId: string;
  gateFlowRate: number;
  weatherCondition: TelemetryInput['weatherCondition'];
  incidentReport: string;
}

const SOP_PRESETS: SOPPreset[] = [
  {
    key: 'normal',
    code: 'SOP-GEN-101',
    label: 'Normal Gate Flow',
    codeColor: 'text-emerald-400',
    gateId: 'Gate A',
    gateFlowRate: 45,
    weatherCondition: 'Clear',
    incidentReport: '',
  },
  {
    key: 'overflow',
    code: 'SOP-FLOW-302',
    label: 'Gate B Congestion',
    codeColor: 'text-yellow-400',
    gateId: 'Gate B',
    gateFlowRate: 92,
    weatherCondition: 'Rain',
    incidentReport: '',
  },
  {
    key: 'lightning',
    code: 'SOP-WEA-109',
    label: 'Lightning Alert',
    codeColor: 'text-red-400',
    gateId: 'Gate D',
    gateFlowRate: 62,
    weatherCondition: 'Lightning',
    incidentReport: '',
  },
  {
    key: 'medical',
    code: 'SOP-SEC-404',
    label: 'Medical Incident',
    codeColor: 'text-red-400',
    gateId: 'Gate C',
    gateFlowRate: 55,
    weatherCondition: 'Clear',
    incidentReport: 'Medical emergency at Section 112: spectator collapsed. Paramedics dispatched.',
  },
  {
    key: 'blockage',
    code: 'SOP-SEC-404',
    label: 'Walkway Blockage',
    codeColor: 'text-yellow-400',
    gateId: 'Gate B',
    gateFlowRate: 88,
    weatherCondition: 'Storm',
    incidentReport: 'Access walkway blocked near turnstiles due to equipment failure.',
  },
];

// ─── Main Operator Dashboard ───────────────────────────────────────────────────

export default function OperatorDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [pollingActive, setPollingActive] = useState<boolean>(true);
  
  // Form telemetry state
  const [gateId, setGateId] = useState<string>('Gate A');
  const [gateFlowRate, setGateFlowRate] = useState<number>(45);
  const [weatherCondition, setWeatherCondition] = useState<TelemetryInput['weatherCondition']>('Clear');
  const [incidentReport, setIncidentReport] = useState<string>('');
  
  // Custom message/toast alert
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ─── Memoized Computed Values ────────────────────────────────────────────────

  /** Count of approved broadcasts, memoized to avoid recalculation on every render. */
  const approvedCount = useMemo(
    () => incidents.filter((i) => i.status === 'approved').length,
    [incidents]
  );

  /** Latest weather condition from the most recent incident. */
  const latestWeather = useMemo(
    () => (incidents.length > 0 ? incidents[0].telemetry.weatherCondition : 'Clear'),
    [incidents]
  );

  /** Dynamic color class for the flow rate display. */
  const flowRateColor = useMemo(() => {
    if (gateFlowRate >= 85) return 'text-red-400';
    if (gateFlowRate >= 60) return 'text-yellow-400';
    return 'text-emerald-400';
  }, [gateFlowRate]);

  // ─── Stable Callback Handlers ────────────────────────────────────────────────

  /** Fetches incidents from the API with AbortController support. */
  const fetchIncidents = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/incidents', { signal });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Failed to fetch incidents', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Handles telemetry simulation form submission. */
  const handleDispatch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const telemetry: TelemetryInput = {
      gateId,
      gateFlowRate: Number(gateFlowRate),
      weatherCondition,
      incidentReport: incidentReport.trim() !== '' ? incidentReport : undefined
    };

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry)
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ text: `Telemetry successfully analyzed by Gemini & logged (ID: ${data.id.substring(0, 8)}).`, type: 'success' });
        setIncidentReport('');
        fetchIncidents();
      } else {
        const errorData = await res.json();
        setMessage({ text: `Failed to analyze telemetry: ${errorData.error || 'Server error'}`, type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error communicating with reasoning API.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [gateId, gateFlowRate, weatherCondition, incidentReport, fetchIncidents]);

  /** Applies a SOP preset to the form fields. */
  const applyPreset = useCallback((preset: SOPPreset) => {
    setMessage(null);
    setGateId(preset.gateId);
    setGateFlowRate(preset.gateFlowRate);
    setWeatherCondition(preset.weatherCondition);
    setIncidentReport(preset.incidentReport);
  }, []);

  /** Approves an incident for fan broadcast. */
  const handleApprove = useCallback(async (id: string, gate: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/approve`, {
        method: 'POST'
      });

      if (res.ok) {
        setMessage({ text: `Broadcast approved and live on mobile devices for ${gate}.`, type: 'success' });
        fetchIncidents();
      } else {
        setMessage({ text: 'Failed to approve broadcast redirect.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error updating broadcast status.', type: 'error' });
    }
  }, [fetchIncidents]);

  /** Toggles the polling state. */
  const togglePolling = useCallback(() => {
    setPollingActive((prev) => !prev);
  }, []);

  // ─── Visibility-Aware Polling ────────────────────────────────────────────────

  useEffect(() => {
    const controller = new AbortController();
    fetchIncidents(controller.signal);

    if (!pollingActive) return () => controller.abort();

    let intervalId: ReturnType<typeof setInterval>;

    const startPolling = () => {
      intervalId = setInterval(() => {
        fetchIncidents();
      }, POLLING_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        fetchIncidents();
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
  }, [pollingActive, fetchIncidents]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Navbar */}
      <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between" role="banner">
        <div className="flex items-center gap-3">
          <a href="/" className="bg-red-600 text-white rounded-lg p-2 flex items-center justify-center font-bold tracking-wider text-xs shadow-md" aria-label="Return to Pulse launchpad">
            PULSE
          </a>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              FIFA World Cup 2026 Operations
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" aria-hidden="true"></span>
              Live Venue Telemetry Coordinator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded-full border border-slate-700/50 text-xs" role="status" aria-label="Connection status: online">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span className="text-slate-400">Connection Status:</span>
            <span className="font-semibold text-emerald-400">ONLINE</span>
          </div>

          <button 
            onClick={togglePolling}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              pollingActive 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-yellow-950/40 border-yellow-800 text-yellow-400'
            }`}
            aria-label={pollingActive ? 'Pause operations live polling' : 'Resume operations live polling'}
            aria-pressed={pollingActive}
          >
            <RefreshCw className={`w-3 h-3 ${pollingActive ? 'animate-spin' : ''}`} aria-hidden="true" />
            {pollingActive ? 'Auto-Polling Active' : 'Polling Paused'}
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" role="main">
        
        {/* Left Column: Telemetry Simulation and Presets (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6" aria-labelledby="telemetry-section-title">
          
          {/* Simulation Preset Quick-Launcher */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-500" aria-hidden="true" />
              SOP Simulation Presets
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Instantly load predefined operations scenarios matching FIFA Stadium Standard Operating Procedures (SOPs).
            </p>
            
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="SOP preset buttons">
              {SOP_PRESETS.map((preset) => (
                <button 
                  key={preset.key}
                  onClick={() => applyPreset(preset)}
                  className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-left transition-all group"
                  aria-label={`Load ${preset.label} preset (${preset.code})`}
                >
                  <div className={`text-[11px] font-bold ${preset.codeColor} mb-0.5`}>{preset.code}</div>
                  <div className="text-xs font-medium text-slate-200 group-hover:text-white">{preset.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Simulator Form */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex-1 flex flex-col justify-between">
            <div>
              <h2 id="telemetry-section-title" className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" aria-hidden="true" />
                Live Telemetry Generator
              </h2>

              <form onSubmit={handleDispatch} className="space-y-4" aria-label="Telemetry simulation form">
                
                {/* Gate ID Input */}
                <div>
                  <label htmlFor="gate-select" className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Target Gate ID
                  </label>
                  <select
                    id="gate-select"
                    value={gateId}
                    onChange={(e) => setGateId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-lg p-2 text-sm text-slate-200 focus:outline-none transition-all"
                  >
                    <option value="Gate A">Gate A (Main Entrance North)</option>
                    <option value="Gate B">Gate B (East Wing Entrance)</option>
                    <option value="Gate C">Gate C (South Plaza Entrance)</option>
                    <option value="Gate D">Gate D (West Wing Entrance)</option>
                  </select>
                </div>

                {/* Gate Flow Rate Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                    <label htmlFor="flow-rate">Gate Capacity Load</label>
                    <span className={`font-bold ${flowRateColor}`} aria-live="polite">{gateFlowRate}%</span>
                  </div>
                  <input
                    id="flow-rate"
                    type="range"
                    min="0"
                    max="100"
                    value={gateFlowRate}
                    onChange={(e) => setGateFlowRate(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-600"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={gateFlowRate}
                    aria-valuetext={`${gateFlowRate}% capacity`}
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1" aria-hidden="true">
                    <span>0% (Empty)</span>
                    <span>50% (Normal)</span>
                    <span>85% (SOP Limit)</span>
                    <span>100% (Overloaded)</span>
                  </div>
                </div>

                {/* Weather Dropdown */}
                <div>
                  <label htmlFor="weather-select" className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Weather Condition
                  </label>
                  <select
                    id="weather-select"
                    value={weatherCondition}
                    onChange={(e) => setWeatherCondition(e.target.value as TelemetryInput['weatherCondition'])}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-lg p-2 text-sm text-slate-200 focus:outline-none transition-all"
                  >
                    <option value="Clear">☀️ Clear (Sunny/Calm)</option>
                    <option value="Rain">🌧️ Rain (Light Shower)</option>
                    <option value="Storm">⛈️ Storm (Heavy/High Winds)</option>
                    <option value="Lightning">⚡ Lightning (Severe Danger)</option>
                  </select>
                </div>

                {/* Incident Report Textarea */}
                <div>
                  <label htmlFor="incident-report" className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Active Incident Reports (Optional)
                  </label>
                  <textarea
                    id="incident-report"
                    value={incidentReport}
                    onChange={(e) => setIncidentReport(e.target.value)}
                    placeholder="E.g., Medical emergency at Section 102, Blockage on ramp B2..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 rounded-lg p-2 text-xs text-slate-200 focus:outline-none placeholder-slate-600 transition-all resize-none"
                  ></textarea>
                </div>

                {/* Submit Trigger Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  aria-label="Dispatch simulated telemetry for evaluation"
                  aria-busy={submitting}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      Analyzing Telemetry...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      Dispatch Telemetry &amp; Analyze
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Response notifications */}
            {message && (
              <div 
                className={`mt-4 p-3.5 rounded-lg border text-xs font-medium animate-fade-in ${
                  message.type === 'success' 
                    ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-400' 
                    : 'bg-red-950/20 border-red-800/50 text-red-400'
                }`}
                role="alert"
                aria-live="polite"
              >
                {message.text}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Live Overview and Incidents Feed (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6" aria-labelledby="operations-feed-title">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3" role="region" aria-label="Operations statistics">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Active Gates
              </span>
              <span className="text-2xl font-bold text-slate-100 mt-1" aria-label="4 out of 4 gates active">4 / 4</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Operating normally</span>
            </div>
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Current Weather
              </span>
              <span className="text-lg font-bold text-slate-100 mt-1.5 truncate" role="status">
                {latestWeather}
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">Based on latest tele</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Broadcasts
              </span>
              <span className="text-2xl font-bold text-rose-500 mt-1" role="status" aria-label={`${approvedCount} approved redirect alerts`}>
                {approvedCount}
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">Approved redirect alerts</span>
            </div>
          </div>

          {/* Active Incidents Operations & Decision Feed */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 id="operations-feed-title" className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" aria-hidden="true" />
                Operations &amp; Decision Feed
              </h2>
              <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-slate-400 font-semibold" aria-label={`${incidents.length} logged incidents`}>
                {incidents.length} logs
              </span>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 gap-2" role="status" aria-busy="true">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-500" aria-hidden="true" />
                <span className="text-xs font-semibold">Polling active incidents...</span>
              </div>
            ) : incidents.length === 0 ? (
              <div className="flex-1 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center py-16 text-center px-6">
                <Activity className="w-8 h-8 text-slate-700 mb-3 animate-pulse" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-400">No Telemetry Dispatched Yet</h3>
                <p className="text-xs text-slate-600 max-w-sm mt-1">
                  Use the live telemetry generator on the left to trigger SOP alerts and retrieve Gemini recommendations.
                </p>
              </div>
            ) : (
              <div 
                className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar" 
                role="feed" 
                aria-label="Live incident feed"
                aria-live="polite"
              >
                {incidents.map((incident) => (
                  <IncidentCard 
                    key={incident.id} 
                    incident={incident} 
                    onApprove={handleApprove} 
                  />
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 p-4 text-center text-xs text-slate-600" role="contentinfo">
        © FIFA World Cup 2026 Stadium Operations Console • Pulse AI Engine. Powered by Gemini.
      </footer>
    </div>
  );
}
