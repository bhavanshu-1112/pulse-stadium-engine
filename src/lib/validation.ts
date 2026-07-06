/**
 * @fileoverview Shared telemetry input validation and sanitization utilities.
 * Centralizes validation logic that was previously duplicated across API routes,
 * ensuring consistent enforcement of input constraints and security hardening.
 */

import { TelemetryInput } from '../types';
import { VALID_WEATHER_CONDITIONS } from './constants';

/** Validation result for telemetry input parsing. */
export interface ValidationResult {
  success: true;
  data: TelemetryInput;
}

/** Validation error result with descriptive message. */
export interface ValidationError {
  success: false;
  error: string;
}

/**
 * Strips HTML tags from a string to prevent XSS injection via incident reports.
 * @param input - The raw user-provided string.
 * @returns The sanitized string with HTML tags removed.
 */
export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validates and parses a raw request body into a strongly-typed {@link TelemetryInput}.
 *
 * Performs the following checks:
 * - `gateId`: must be a non-empty string
 * - `gateFlowRate`: must be a number between 0 and 100 (inclusive)
 * - `weatherCondition`: must be one of the accepted {@link VALID_WEATHER_CONDITIONS}
 * - `incidentReport` (optional): sanitized for HTML/XSS if provided
 *
 * @param body - The raw parsed JSON body from the incoming request.
 * @returns A discriminated union: `{ success: true, data }` or `{ success: false, error }`.
 *
 * @example
 * ```ts
 * const result = validateTelemetryInput(await req.json());
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 400 });
 * }
 * const telemetry = result.data;
 * ```
 */
export function validateTelemetryInput(
  body: Record<string, unknown>
): ValidationResult | ValidationError {
  const { gateId, gateFlowRate, weatherCondition, incidentReport } = body;

  // Validate gateId: must be a non-empty string
  if (typeof gateId !== 'string' || gateId.trim() === '') {
    return { success: false, error: 'Invalid or missing gateId.' };
  }

  // Validate gateFlowRate: must be a number in [0, 100]
  if (typeof gateFlowRate !== 'number' || gateFlowRate < 0 || gateFlowRate > 100) {
    return {
      success: false,
      error: 'gateFlowRate must be a number between 0 and 100.',
    };
  }

  // Validate weatherCondition: must be an accepted enum value
  if (
    typeof weatherCondition !== 'string' ||
    !VALID_WEATHER_CONDITIONS.includes(
      weatherCondition as (typeof VALID_WEATHER_CONDITIONS)[number]
    )
  ) {
    return {
      success: false,
      error: `Invalid weatherCondition. Must be one of ${VALID_WEATHER_CONDITIONS.join(', ')}.`,
    };
  }

  // Sanitize and validate optional incident report
  const sanitizedReport =
    typeof incidentReport === 'string' && incidentReport.trim() !== ''
      ? sanitizeInput(incidentReport)
      : undefined;

  const telemetry: TelemetryInput = {
    gateId: gateId.trim(),
    gateFlowRate,
    weatherCondition: weatherCondition as TelemetryInput['weatherCondition'],
    incidentReport: sanitizedReport,
  };

  return { success: true, data: telemetry };
}
