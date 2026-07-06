/**
 * @fileoverview Centralized application constants for the Pulse Stadium Engine.
 * All magic numbers, thresholds, and configuration values are defined here
 * to ensure a single source of truth across the application.
 */

/** Polling interval in milliseconds for live data feeds. */
export const POLLING_INTERVAL_MS = 3000;

/** Debounce delay in milliseconds for slider and form input changes. */
export const DEBOUNCE_DELAY_MS = 150;

// ─── SOP Threshold Constants ───────────────────────────────────────────────────

/** Gate capacity percentage that triggers SOP-FLOW-302 crowd redirection. */
export const GATE_OVERFLOW_THRESHOLD = 85;

/** Gate capacity percentage that escalates to CRITICAL severity under SOP-FLOW-302. */
export const GATE_CRITICAL_THRESHOLD = 95;

/** Default perimeter isolation radius (meters) for SOP-SEC-404 incidents. */
export const ISOLATION_PERIMETER_METERS = 20;

// ─── SOP Code References ───────────────────────────────────────────────────────

export const SOP_CODES = {
  NORMAL_FLOW: 'SOP-GEN-101',
  GATE_REDIRECT: 'SOP-FLOW-302',
  RAIN_ADVISORY: 'SOP-WEA-108',
  LIGHTNING_EVACUATION: 'SOP-WEA-109',
  INCIDENT_ISOLATION: 'SOP-SEC-404',
} as const;

// ─── Gate Mapping ──────────────────────────────────────────────────────────────

/** Circular mapping of gates to their nearest adjacent alternative. */
export const ADJACENT_GATE_MAP: Readonly<Record<string, string>> = {
  'Gate A': 'Gate B',
  'Gate B': 'Gate C',
  'Gate C': 'Gate D',
  'Gate D': 'Gate A',
};

/** Default fallback gate when the current gate is not in the mapping. */
export const DEFAULT_FALLBACK_GATE = 'Gate B';

// ─── Valid Input Enumerations ──────────────────────────────────────────────────

/** Accepted weather condition values for telemetry input validation. */
export const VALID_WEATHER_CONDITIONS = ['Clear', 'Rain', 'Storm', 'Lightning'] as const;

/** Accepted gate identifiers for telemetry input. */
export const VALID_GATE_IDS = ['Gate A', 'Gate B', 'Gate C', 'Gate D'] as const;

// ─── Severity Levels ───────────────────────────────────────────────────────────

export const SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;

// ─── Delay Estimates (minutes) ─────────────────────────────────────────────────

export const ESTIMATED_DELAYS = {
  NONE: 0,
  RAIN_ADVISORY: 5,
  GATE_REDIRECT: 12,
  INCIDENT_RESPONSE: 15,
} as const;
