/**
 * @fileoverview Standalone AI reasoning API route.
 *
 * - `POST /api/reasoning` — Validates telemetry input and returns the Gemini AI
 *   dual-payload analysis directly without persisting an incident record.
 *   Useful for preview/dry-run analysis scenarios.
 *
 * @module api/reasoning
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeTelemetry } from '@/lib/gemini';
import { validateTelemetryInput } from '@/lib/validation';
import { logger } from '@/lib/logger';

/**
 * Analyzes telemetry via the AI reasoning pipeline and returns the result
 * without creating a persistent incident record.
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

    // Analyze using the Gemini coordinator (secure server-side call)
    const dualPayload = await analyzeTelemetry(telemetry);

    return NextResponse.json(dualPayload);
  } catch (error: unknown) {
    logger.error('Error in /api/reasoning', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
