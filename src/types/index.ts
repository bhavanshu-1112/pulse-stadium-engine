/**
 * @fileoverview Strict TypeScript type definitions for the Pulse Stadium Engine.
 *
 * Defines the core data structures used across the application, including
 * telemetry inputs, AI-generated payloads, and incident records. All types
 * enforce strict literal unions to ensure type safety at compile time.
 *
 * @module types
 */

/** Severity classification levels for staff operations alerts. */
export type SeverityLevel = 'INFO' | 'WARNING' | 'CRITICAL';

/**
 * Input telemetry data captured from a stadium gate sensor.
 * Represents a single snapshot of real-time conditions at a specific gate.
 */
export interface TelemetryInput {
  /** Identifier of the stadium gate (e.g., "Gate A", "Gate B"). */
  gateId: string;
  /** Current crowd capacity percentage at the gate (0–100). */
  gateFlowRate: number;
  /** Current weather condition at the venue. */
  weatherCondition: 'Clear' | 'Rain' | 'Storm' | 'Lightning';
  /** Optional free-text description of an active incident (medical, blockage, hazard). */
  incidentReport?: string;
}

/**
 * AI-generated payload containing professional, actionable instructions
 * for stadium operations staff, including SOP references and severity.
 */
export interface StaffPayload {
  /** Detailed, SOP-driven recommendation for the operations team. */
  recommendation: string;
  /** Alert severity classification. */
  severity: SeverityLevel;
  /** Standard Operating Procedure code referenced by this recommendation. */
  sopCited: string;
}

/**
 * AI-generated payload containing empathetic, bilingual instructions
 * for stadium fans, along with UI metadata for visual presentation.
 */
export interface FanPayload {
  /** Fan-facing instruction message in English. */
  englishMessage: string;
  /** Fan-facing instruction message in Spanish. */
  spanishMessage: string;
  /** Visual theme color for the alert card UI. */
  themeColor: 'green' | 'yellow' | 'red';
  /** Icon classification for the alert card UI. */
  alertIcon: 'info' | 'warning' | 'alert';
  /** Estimated delay in minutes for the fan. */
  estimatedDelayMinutes: number;
  /** Suggested alternative gate for crowd redirection (only when applicable). */
  redirectGate?: string;
}

/**
 * Combined dual-payload response from the Gemini AI reasoning pipeline.
 * Contains distinct instructions for both staff and fans from a single API call.
 */
export interface DualPayload {
  /** Operations staff instructions and SOP analysis. */
  staff_payload: StaffPayload;
  /** Fan-facing bilingual messages and UI metadata. */
  fan_payload: FanPayload;
}

/**
 * A persisted incident record combining telemetry input, AI analysis,
 * and an approval workflow status for broadcast to the fan mobile view.
 */
export interface Incident {
  /** Unique identifier (UUID v4). */
  id: string;
  /** ISO 8601 timestamp of when the incident was created. */
  timestamp: string;
  /** The original telemetry input that triggered this incident. */
  telemetry: TelemetryInput;
  /** AI-generated staff operations payload. */
  staffPayload: StaffPayload;
  /** AI-generated fan communication payload. */
  fanPayload: FanPayload;
  /** Approval workflow status: pending operator review, approved for broadcast, or dismissed. */
  status: 'pending' | 'approved' | 'dismissed';
}
