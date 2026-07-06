export type SeverityLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface TelemetryInput {
  gateId: string;
  gateFlowRate: number; // percentage flow capacity (0 to 100)
  weatherCondition: 'Clear' | 'Rain' | 'Storm' | 'Lightning';
  incidentReport?: string;
}

export interface StaffPayload {
  recommendation: string;
  severity: SeverityLevel;
  sopCited: string;
}

export interface FanPayload {
  englishMessage: string;
  spanishMessage: string;
  themeColor: 'green' | 'yellow' | 'red'; // visual UI card theme color
  alertIcon: 'info' | 'warning' | 'alert'; // metadata for UI
  estimatedDelayMinutes: number; // metadata for UI
  redirectGate?: string; // metadata for redirect UI
}

export interface DualPayload {
  staff_payload: StaffPayload;
  fan_payload: FanPayload;
}

export interface Incident {
  id: string;
  timestamp: string;
  telemetry: TelemetryInput;
  staffPayload: StaffPayload;
  fanPayload: FanPayload;
  status: 'pending' | 'approved' | 'dismissed';
}
