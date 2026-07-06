import { validateTelemetryInput, sanitizeInput } from '../lib/validation';

describe('Telemetry Validation Utility Tests', () => {
  // ─── Valid Input Tests ──────────────────────────────────────────────────────

  it('should accept valid telemetry with all fields', () => {
    const result = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
      incidentReport: 'Test incident report',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gateId).toBe('Gate A');
      expect(result.data.gateFlowRate).toBe(50);
      expect(result.data.weatherCondition).toBe('Clear');
      expect(result.data.incidentReport).toBe('Test incident report');
    }
  });

  it('should accept valid telemetry without optional incidentReport', () => {
    const result = validateTelemetryInput({
      gateId: 'Gate B',
      gateFlowRate: 80,
      weatherCondition: 'Rain',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.incidentReport).toBeUndefined();
    }
  });

  it('should accept boundary flow rate values (0 and 100)', () => {
    const resultZero = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: 0,
      weatherCondition: 'Clear',
    });
    expect(resultZero.success).toBe(true);

    const resultHundred = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: 100,
      weatherCondition: 'Clear',
    });
    expect(resultHundred.success).toBe(true);
  });

  it('should accept all valid weather conditions', () => {
    const conditions = ['Clear', 'Rain', 'Storm', 'Lightning'];
    for (const condition of conditions) {
      const result = validateTelemetryInput({
        gateId: 'Gate A',
        gateFlowRate: 50,
        weatherCondition: condition,
      });
      expect(result.success).toBe(true);
    }
  });

  // ─── Invalid gateId Tests ──────────────────────────────────────────────────

  it('should reject missing gateId', () => {
    const result = validateTelemetryInput({
      gateFlowRate: 50,
      weatherCondition: 'Clear',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('gateId');
    }
  });

  it('should reject empty gateId string', () => {
    const result = validateTelemetryInput({
      gateId: '',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
    });
    expect(result.success).toBe(false);
  });

  it('should reject whitespace-only gateId', () => {
    const result = validateTelemetryInput({
      gateId: '   ',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-string gateId', () => {
    const result = validateTelemetryInput({
      gateId: 42,
      gateFlowRate: 50,
      weatherCondition: 'Clear',
    });
    expect(result.success).toBe(false);
  });

  // ─── Invalid gateFlowRate Tests ────────────────────────────────────────────

  it('should reject negative flow rate', () => {
    const result = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: -1,
      weatherCondition: 'Clear',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('gateFlowRate');
    }
  });

  it('should reject flow rate above 100', () => {
    const result = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: 101,
      weatherCondition: 'Clear',
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-number flow rate', () => {
    const result = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: '50',
      weatherCondition: 'Clear',
    });
    expect(result.success).toBe(false);
  });

  // ─── Invalid weatherCondition Tests ────────────────────────────────────────

  it('should reject invalid weather condition', () => {
    const result = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: 50,
      weatherCondition: 'Sunny',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('weatherCondition');
    }
  });

  it('should reject case-mismatched weather condition', () => {
    const result = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: 50,
      weatherCondition: 'clear',
    });
    expect(result.success).toBe(false);
  });

  // ─── Input Sanitization Tests ──────────────────────────────────────────────

  it('should sanitize HTML tags from incident reports (XSS prevention)', () => {
    const result = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
      incidentReport: '<script>alert("xss")</script>Medical emergency',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.incidentReport).toBe('alert("xss")Medical emergency');
      expect(result.data.incidentReport).not.toContain('<script>');
    }
  });

  it('should treat empty/whitespace-only incident report as undefined', () => {
    const result = validateTelemetryInput({
      gateId: 'Gate A',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
      incidentReport: '   ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.incidentReport).toBeUndefined();
    }
  });

  it('should trim whitespace from gateId', () => {
    const result = validateTelemetryInput({
      gateId: '  Gate A  ',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gateId).toBe('Gate A');
    }
  });
});

describe('sanitizeInput utility', () => {
  it('should remove HTML tags from strings', () => {
    expect(sanitizeInput('<b>bold</b>')).toBe('bold');
    expect(sanitizeInput('<a href="evil">click</a>')).toBe('click');
  });

  it('should preserve non-HTML text', () => {
    expect(sanitizeInput('Normal text here')).toBe('Normal text here');
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  spaced  ')).toBe('spaced');
  });
});
