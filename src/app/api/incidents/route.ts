/**
 * @fileoverview API route for stadium incident management.
 *
 * - `GET /api/incidents` — Returns all incidents sorted by timestamp (newest first).
 * - `POST /api/incidents` — Validates telemetry input, invokes the Gemini AI reasoning
 *   pipeline, persists the resulting incident, and returns it with a 201 status.
 *
 * @module api/incidents
 */

import { NextRequest, NextResponse } from 'next/server';
import { incidents } from '@/lib/db';
import { analyzeTelemetry } from '@/lib/gemini';
import { validateTelemetryInput } from '@/lib/validation';
import { Incident } from '@/types';

/**
 * Retrieves all incidents from the in-memory store, sorted by timestamp descending.
 * Includes Cache-Control headers to prevent stale polling data.
 */
export async function GET() {
  const sorted = [...incidents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return NextResponse.json(sorted, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}

/**
 * Accepts telemetry input, analyzes it via the AI reasoning pipeline,
 * and persists the resulting incident with a 'pending' approval status.
 */
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // Use shared validation utility (DRY)
    const validationResult = validateTelemetryInput(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const telemetry = validationResult.data;

    // Request dual-payload analysis from Gemini API
    const analysis = await analyzeTelemetry(telemetry);

    // Assemble new Incident object
    const newIncident: Incident = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      telemetry,
      staffPayload: analysis.staff_payload,
      fanPayload: analysis.fan_payload,
      status: 'pending',
    };

    incidents.push(newIncident);

    return NextResponse.json(newIncident, { status: 201 });
  } catch (error: unknown) {
    console.error('Error in POST /api/incidents:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
