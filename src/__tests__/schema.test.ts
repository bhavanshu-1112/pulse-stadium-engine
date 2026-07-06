import { analyzeTelemetry } from '../lib/gemini';
import { TelemetryInput } from '../types';

describe('Gemini Schema and Fallback Parser Tests', () => {
  it('should generate a valid dual-payload for normal gate flow telemetry', async () => {
    const normalTelemetry: TelemetryInput = {
      gateId: 'Gate A',
      gateFlowRate: 45,
      weatherCondition: 'Clear',
    };

    const result = await analyzeTelemetry(normalTelemetry);

    // Validate Staff Payload Structure
    expect(result).toHaveProperty('staff_payload');
    expect(result.staff_payload).toHaveProperty('recommendation');
    expect(result.staff_payload).toHaveProperty('severity');
    expect(result.staff_payload).toHaveProperty('sopCited');
    expect(result.staff_payload.severity).toBe('INFO');
    expect(result.staff_payload.sopCited).toBe('SOP-GEN-101');

    // Validate Fan Payload Structure
    expect(result).toHaveProperty('fan_payload');
    expect(result.fan_payload).toHaveProperty('englishMessage');
    expect(result.fan_payload).toHaveProperty('spanishMessage');
    expect(result.fan_payload).toHaveProperty('themeColor');
    expect(result.fan_payload).toHaveProperty('alertIcon');
    expect(result.fan_payload).toHaveProperty('estimatedDelayMinutes');
    expect(result.fan_payload.themeColor).toBe('green');
    expect(result.fan_payload.alertIcon).toBe('info');
  });

  it('should generate warning and redirection for gate capacity overflow (>=85%)', async () => {
    const overflowTelemetry: TelemetryInput = {
      gateId: 'Gate B',
      gateFlowRate: 92,
      weatherCondition: 'Rain',
    };

    const result = await analyzeTelemetry(overflowTelemetry);

    expect(result.staff_payload.severity).toBe('WARNING');
    expect(result.staff_payload.sopCited).toBe('SOP-FLOW-302');
    expect(result.fan_payload.themeColor).toBe('yellow');
    expect(result.fan_payload.alertIcon).toBe('warning');
    expect(result.fan_payload).toHaveProperty('redirectGate');
    expect(result.fan_payload.redirectGate).toBe('Gate C');
  });

  it('should escalate to CRITICAL and order concourse shielding for weather lightning', async () => {
    const lightningTelemetry: TelemetryInput = {
      gateId: 'Gate D',
      gateFlowRate: 60,
      weatherCondition: 'Lightning',
    };

    const result = await analyzeTelemetry(lightningTelemetry);

    expect(result.staff_payload.severity).toBe('CRITICAL');
    expect(result.staff_payload.sopCited).toBe('SOP-WEA-109');
    expect(result.fan_payload.themeColor).toBe('red');
    expect(result.fan_payload.alertIcon).toBe('alert');
  });

  it('should isolate sector on incident report telemetry', async () => {
    const incidentTelemetry: TelemetryInput = {
      gateId: 'Gate C',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
      incidentReport: 'Medical emergency reported in sector 200',
    };

    const result = await analyzeTelemetry(incidentTelemetry);

    expect(result.staff_payload.severity).toBe('CRITICAL');
    expect(result.staff_payload.sopCited).toBe('SOP-SEC-404');
    expect(result.fan_payload.themeColor).toBe('red');
  });
});
