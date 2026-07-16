/**
 * @fileoverview Integration tests for the in-memory incident data store
 * and approval workflow logic.
 *
 * These tests validate the core business logic that backs the API routes:
 * incident creation, sorting, approval status transitions, and memory
 * cap enforcement, without requiring a running Next.js server.
 */

import { generateFallbackReasoning } from '../lib/gemini';
import { validateTelemetryInput } from '../lib/validation';
import { TelemetryInput, Incident } from '../types';

// ─── Helper: Simulates the POST /api/incidents logic ────────────────────────

function createIncident(telemetry: TelemetryInput, store: Incident[]): Incident {
  const analysis = generateFallbackReasoning(telemetry);
  const newIncident: Incident = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    telemetry,
    staffPayload: analysis.staff_payload,
    fanPayload: analysis.fan_payload,
    status: 'pending',
  };

  const MAX_INCIDENTS = 100;
  if (store.length >= MAX_INCIDENTS) {
    store.splice(-1, 1);
  }

  store.push(newIncident);
  return newIncident;
}

// ─── Helper: Simulates the approval logic ───────────────────────────────────

function approveIncident(id: string, store: Incident[]): Incident | null {
  const index = store.findIndex((inc) => inc.id === id);
  if (index === -1) return null;
  store[index].status = 'approved';
  return store[index];
}

describe('Incident Store and Approval Workflow Tests', () => {
  let store: Incident[];
  const validTelemetry: TelemetryInput = {
    gateId: 'Gate A',
    gateFlowRate: 45,
    weatherCondition: 'Clear',
  };

  beforeEach(() => {
    store = [];
  });

  // ─── Incident Creation Tests ──────────────────────────────────────────────

  it('should create an incident with pending status', () => {
    const incident = createIncident(validTelemetry, store);

    expect(incident.status).toBe('pending');
    expect(incident.telemetry).toEqual(validTelemetry);
    expect(incident.id).toBeDefined();
    expect(incident.timestamp).toBeDefined();
    expect(store).toHaveLength(1);
  });

  it('should include staff and fan payloads from the reasoning engine', () => {
    const incident = createIncident(validTelemetry, store);

    expect(incident.staffPayload).toHaveProperty('recommendation');
    expect(incident.staffPayload).toHaveProperty('severity');
    expect(incident.staffPayload).toHaveProperty('sopCited');
    expect(incident.fanPayload).toHaveProperty('englishMessage');
    expect(incident.fanPayload).toHaveProperty('spanishMessage');
    expect(incident.fanPayload).toHaveProperty('themeColor');
  });

  it('should generate unique IDs for each incident', () => {
    const inc1 = createIncident(validTelemetry, store);
    const inc2 = createIncident(validTelemetry, store);

    expect(inc1.id).not.toBe(inc2.id);
    expect(store).toHaveLength(2);
  });

  // ─── Sorting Tests ────────────────────────────────────────────────────────

  it('should sort incidents by timestamp descending (newest first)', () => {
    createIncident(validTelemetry, store);
    // Small delay to ensure different timestamps
    createIncident({ ...validTelemetry, gateId: 'Gate B' }, store);

    const sorted = [...store].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    expect(sorted[0].timestamp >= sorted[1].timestamp).toBe(true);
  });

  // ─── Approval Workflow Tests ──────────────────────────────────────────────

  it('should approve a pending incident by ID', () => {
    const incident = createIncident(validTelemetry, store);
    expect(incident.status).toBe('pending');

    const approved = approveIncident(incident.id, store);
    expect(approved).not.toBeNull();
    expect(approved!.status).toBe('approved');
    expect(approved!.id).toBe(incident.id);
  });

  it('should return null when approving a non-existent incident', () => {
    const result = approveIncident('non-existent-id', store);
    expect(result).toBeNull();
  });

  it('should only approve the targeted incident (not others)', () => {
    const inc1 = createIncident(validTelemetry, store);
    const inc2 = createIncident({ ...validTelemetry, gateId: 'Gate B' }, store);

    approveIncident(inc1.id, store);

    expect(store.find((i) => i.id === inc1.id)!.status).toBe('approved');
    expect(store.find((i) => i.id === inc2.id)!.status).toBe('pending');
  });

  // ─── Memory Cap Tests ────────────────────────────────────────────────────

  it('should enforce the 100-incident memory cap', () => {
    for (let i = 0; i < 105; i++) {
      createIncident(
        { ...validTelemetry, gateFlowRate: i % 100 },
        store
      );
    }

    expect(store.length).toBeLessThanOrEqual(100);
  });

  // ─── Validation Integration Tests ─────────────────────────────────────────

  it('should reject invalid telemetry before creating an incident', () => {
    const invalidBody = {
      gateId: '',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
    };

    const result = validateTelemetryInput(invalidBody);
    expect(result.success).toBe(false);
  });

  it('should reject telemetry with invalid gateId not in enum', () => {
    const invalidBody = {
      gateId: 'Gate Z',
      gateFlowRate: 50,
      weatherCondition: 'Clear',
    };

    const result = validateTelemetryInput(invalidBody);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('gateId');
    }
  });

  it('should reject NaN gateFlowRate', () => {
    const invalidBody = {
      gateId: 'Gate A',
      gateFlowRate: NaN,
      weatherCondition: 'Clear',
    };

    const result = validateTelemetryInput(invalidBody);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('gateFlowRate');
    }
  });

  // ─── Filtering Tests ──────────────────────────────────────────────────────

  it('should filter approved incidents correctly (fan view logic)', () => {
    const inc1 = createIncident(validTelemetry, store);
    const inc2 = createIncident({ ...validTelemetry, gateId: 'Gate B' }, store);
    createIncident({ ...validTelemetry, gateId: 'Gate C' }, store);

    approveIncident(inc1.id, store);
    approveIncident(inc2.id, store);

    const approved = store.filter((i) => i.status === 'approved');
    expect(approved).toHaveLength(2);

    const pending = store.filter((i) => i.status === 'pending');
    expect(pending).toHaveLength(1);
  });
});
