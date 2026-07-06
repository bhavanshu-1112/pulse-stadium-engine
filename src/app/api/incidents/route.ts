import { NextRequest, NextResponse } from 'next/server';
import { incidents } from '@/lib/db';
import { analyzeTelemetry } from '@/lib/gemini';
import { TelemetryInput, Incident } from '@/types';

export async function GET() {
  // Sort incidents by timestamp descending so latest alerts appear first
  const sorted = [...incidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { gateId, gateFlowRate, weatherCondition, incidentReport } = body;

    // Validate incoming telemetry parameters
    if (typeof gateId !== 'string' || gateId.trim() === '') {
      return NextResponse.json({ error: 'Invalid or missing gateId.' }, { status: 400 });
    }

    if (typeof gateFlowRate !== 'number' || gateFlowRate < 0 || gateFlowRate > 100) {
      return NextResponse.json({ error: 'gateFlowRate must be a number between 0 and 100.' }, { status: 400 });
    }

    const validConditions = ['Clear', 'Rain', 'Storm', 'Lightning'];
    if (!validConditions.includes(weatherCondition)) {
      return NextResponse.json({ error: 'Invalid weatherCondition. Must be one of Clear, Rain, Storm, Lightning.' }, { status: 400 });
    }

    const telemetry: TelemetryInput = {
      gateId,
      gateFlowRate,
      weatherCondition: weatherCondition as TelemetryInput['weatherCondition'],
      incidentReport: typeof incidentReport === 'string' && incidentReport.trim() !== '' ? incidentReport : undefined,
    };

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
