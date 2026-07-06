import { analyzeTelemetry, generateFallbackReasoning, getAdjacentGate } from '../lib/gemini';
import { TelemetryInput } from '../types';
import { SOP_CODES, SEVERITY, GATE_OVERFLOW_THRESHOLD, GATE_CRITICAL_THRESHOLD } from '../lib/constants';

describe('Gemini Schema and Fallback Parser Tests', () => {
  // ─── Normal Flow Tests ──────────────────────────────────────────────────────

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
    expect(result.staff_payload.severity).toBe(SEVERITY.INFO);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.NORMAL_FLOW);

    // Validate Fan Payload Structure
    expect(result).toHaveProperty('fan_payload');
    expect(result.fan_payload).toHaveProperty('englishMessage');
    expect(result.fan_payload).toHaveProperty('spanishMessage');
    expect(result.fan_payload).toHaveProperty('themeColor');
    expect(result.fan_payload).toHaveProperty('alertIcon');
    expect(result.fan_payload).toHaveProperty('estimatedDelayMinutes');
    expect(result.fan_payload.themeColor).toBe('green');
    expect(result.fan_payload.alertIcon).toBe('info');
    expect(result.fan_payload.estimatedDelayMinutes).toBe(0);
  });

  // ─── Gate Overflow Tests ────────────────────────────────────────────────────

  it('should generate warning and redirection for gate capacity overflow (>=85%)', async () => {
    const overflowTelemetry: TelemetryInput = {
      gateId: 'Gate B',
      gateFlowRate: 92,
      weatherCondition: 'Rain',
    };

    const result = await analyzeTelemetry(overflowTelemetry);

    expect(result.staff_payload.severity).toBe(SEVERITY.WARNING);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.GATE_REDIRECT);
    expect(result.fan_payload.themeColor).toBe('yellow');
    expect(result.fan_payload.alertIcon).toBe('warning');
    expect(result.fan_payload).toHaveProperty('redirectGate');
    expect(result.fan_payload.redirectGate).toBe('Gate C');
  });

  it('should trigger overflow at the exact threshold boundary (85%)', async () => {
    const boundaryTelemetry: TelemetryInput = {
      gateId: 'Gate A',
      gateFlowRate: GATE_OVERFLOW_THRESHOLD,
      weatherCondition: 'Clear',
    };

    const result = await analyzeTelemetry(boundaryTelemetry);

    expect(result.staff_payload.severity).toBe(SEVERITY.WARNING);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.GATE_REDIRECT);
    expect(result.fan_payload.redirectGate).toBe('Gate B');
  });

  it('should escalate to CRITICAL and red theme when gate flow >= 95%', async () => {
    const criticalFlowTelemetry: TelemetryInput = {
      gateId: 'Gate C',
      gateFlowRate: GATE_CRITICAL_THRESHOLD,
      weatherCondition: 'Clear',
    };

    const result = await analyzeTelemetry(criticalFlowTelemetry);

    expect(result.staff_payload.severity).toBe(SEVERITY.CRITICAL);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.GATE_REDIRECT);
    expect(result.fan_payload.themeColor).toBe('red');
    expect(result.fan_payload.alertIcon).toBe('warning');
    expect(result.fan_payload.redirectGate).toBe('Gate D');
  });

  // ─── Lightning Tests ────────────────────────────────────────────────────────

  it('should escalate to CRITICAL and order concourse shielding for weather lightning', async () => {
    const lightningTelemetry: TelemetryInput = {
      gateId: 'Gate D',
      gateFlowRate: 60,
      weatherCondition: 'Lightning',
    };

    const result = await analyzeTelemetry(lightningTelemetry);

    expect(result.staff_payload.severity).toBe(SEVERITY.CRITICAL);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.LIGHTNING_EVACUATION);
    expect(result.fan_payload.themeColor).toBe('red');
    expect(result.fan_payload.alertIcon).toBe('alert');
    expect(result.fan_payload.estimatedDelayMinutes).toBe(0);
  });

  it('should prioritize lightning over high gate flow', async () => {
    const conflictTelemetry: TelemetryInput = {
      gateId: 'Gate A',
      gateFlowRate: 95,
      weatherCondition: 'Lightning',
    };

    const result = await analyzeTelemetry(conflictTelemetry);

    // Lightning (SOP-WEA-109) takes priority over flow overflow (SOP-FLOW-302)
    expect(result.staff_payload.severity).toBe(SEVERITY.CRITICAL);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.LIGHTNING_EVACUATION);
  });

  // ─── Incident Report Tests ──────────────────────────────────────────────────

  it('should isolate sector on incident report telemetry', async () => {
    const incidentTelemetry: TelemetryInput = {
      gateId: 'Gate C',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
      incidentReport: 'Medical emergency reported in sector 200',
    };

    const result = await analyzeTelemetry(incidentTelemetry);

    expect(result.staff_payload.severity).toBe(SEVERITY.CRITICAL);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.INCIDENT_ISOLATION);
    expect(result.fan_payload.themeColor).toBe('red');
    expect(result.fan_payload.alertIcon).toBe('alert');
  });

  it('should ignore empty incident reports (whitespace only)', async () => {
    const emptyIncidentTelemetry: TelemetryInput = {
      gateId: 'Gate A',
      gateFlowRate: 40,
      weatherCondition: 'Clear',
      incidentReport: '   ',
    };

    const result = generateFallbackReasoning(emptyIncidentTelemetry);

    // Should fall through to default normal flow, not trigger SOP-SEC-404
    expect(result.staff_payload.severity).toBe(SEVERITY.INFO);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.NORMAL_FLOW);
  });

  // ─── Rain/Storm Advisory Tests ──────────────────────────────────────────────

  it('should generate rain advisory for rainy weather (SOP-WEA-108)', async () => {
    const rainTelemetry: TelemetryInput = {
      gateId: 'Gate B',
      gateFlowRate: 50,
      weatherCondition: 'Rain',
    };

    const result = await analyzeTelemetry(rainTelemetry);

    expect(result.staff_payload.severity).toBe(SEVERITY.WARNING);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.RAIN_ADVISORY);
    expect(result.fan_payload.themeColor).toBe('yellow');
    expect(result.fan_payload.alertIcon).toBe('info');
    expect(result.fan_payload.estimatedDelayMinutes).toBe(5);
  });

  it('should generate storm advisory under SOP-WEA-108', async () => {
    const stormTelemetry: TelemetryInput = {
      gateId: 'Gate D',
      gateFlowRate: 30,
      weatherCondition: 'Storm',
    };

    const result = await analyzeTelemetry(stormTelemetry);

    expect(result.staff_payload.severity).toBe(SEVERITY.WARNING);
    expect(result.staff_payload.sopCited).toBe(SOP_CODES.RAIN_ADVISORY);
    expect(result.fan_payload.themeColor).toBe('yellow');
  });

  // ─── Gate Adjacency Helper Tests ────────────────────────────────────────────

  it('should return the correct adjacent gate for all known gates', () => {
    expect(getAdjacentGate('Gate A')).toBe('Gate B');
    expect(getAdjacentGate('Gate B')).toBe('Gate C');
    expect(getAdjacentGate('Gate C')).toBe('Gate D');
    expect(getAdjacentGate('Gate D')).toBe('Gate A');
  });

  it('should return fallback gate for unknown gate identifiers', () => {
    expect(getAdjacentGate('Gate Z')).toBe('Gate B');
    expect(getAdjacentGate('')).toBe('Gate B');
    expect(getAdjacentGate('Unknown')).toBe('Gate B');
  });

  // ─── Bilingual Message Tests ────────────────────────────────────────────────

  it('should provide both English and Spanish messages in every scenario', () => {
    const scenarios: TelemetryInput[] = [
      { gateId: 'Gate A', gateFlowRate: 40, weatherCondition: 'Clear' },
      { gateId: 'Gate B', gateFlowRate: 90, weatherCondition: 'Rain' },
      { gateId: 'Gate C', gateFlowRate: 50, weatherCondition: 'Lightning' },
      { gateId: 'Gate D', gateFlowRate: 50, weatherCondition: 'Storm' },
      { gateId: 'Gate A', gateFlowRate: 50, weatherCondition: 'Clear', incidentReport: 'Test incident' },
    ];

    for (const scenario of scenarios) {
      const result = generateFallbackReasoning(scenario);

      expect(result.fan_payload.englishMessage).toBeTruthy();
      expect(result.fan_payload.spanishMessage).toBeTruthy();
      expect(typeof result.fan_payload.englishMessage).toBe('string');
      expect(typeof result.fan_payload.spanishMessage).toBe('string');
      expect(result.fan_payload.englishMessage.length).toBeGreaterThan(10);
      expect(result.fan_payload.spanishMessage.length).toBeGreaterThan(10);
    }
  });
});
