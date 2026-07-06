import { NextRequest, NextResponse } from 'next/server';
import { analyzeTelemetry } from '@/lib/gemini';
import { TelemetryInput } from '@/types';

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // Validate telemetry fields
    const { gateId, gateFlowRate, weatherCondition, incidentReport } = body;

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

    // Analyze using the Gemini coordinator (secure server-side call)
    const dualPayload = await analyzeTelemetry(telemetry);

    return NextResponse.json(dualPayload);
  } catch (error: unknown) {
    console.error('Error in /api/reasoning:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
