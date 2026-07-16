/**
 * @fileoverview Gemini AI integration and rule-based fallback reasoning engine.
 *
 * This module provides the core AI analysis pipeline for the Pulse Stadium Engine.
 * It sends telemetry data to the Gemini 1.5 Flash model with structured JSON schema
 * output, and falls back to a deterministic rule-based parser when the API is
 * unavailable, misconfigured, or rate-limited.
 *
 * @module gemini
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { TelemetryInput, DualPayload } from '../types';
import {
  GATE_OVERFLOW_THRESHOLD,
  GATE_CRITICAL_THRESHOLD,
  ADJACENT_GATE_MAP,
  DEFAULT_FALLBACK_GATE,
  SOP_CODES,
  SEVERITY,
  ESTIMATED_DELAYS,
  ISOLATION_PERIMETER_METERS,
} from './constants';
import { logger } from './logger';

const API_KEY = process.env.GEMINI_API_KEY;

// Only initialize if API key is present; fallback handles empty key gracefully
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SYSTEM_INSTRUCTION = `
You are Pulse, the expert GenAI stadium operations coordinator for the FIFA World Cup 2026.
Your job is to analyze real-time stadium telemetry and output a dual-payload JSON matching the requested schema.
You MUST evaluate the input telemetry against the following Venue Standard Operating Procedures (SOPs):

1. SOP-FLOW-302 (Gate Capacity Redirection):
   - Triggered when gateFlowRate >= 85%.
   - Staff Action: Direct operations to redirect incoming traffic from the overloaded gate to the nearest adjacent gate (Gate A -> Gate B; Gate B -> Gate C; Gate C -> Gate D; Gate D -> Gate A).
   - Fan Action: Provide clear, empathetic, multilingual instructions telling fans to use the adjacent gate.
   - Metadata: Set themeColor to "yellow" (or "red" if flow >= 95%), alertIcon to "warning", specify estimatedDelayMinutes (e.g. 10-20 mins) and redirectGate.

2. SOP-WEA-109 (Severe Weather Shelling):
   - Triggered when weatherCondition is "Lightning".
   - Staff Action: Evacuate upper bowl sections immediately. Advise fans to seek covered concourses. Reference SOP-WEA-109. Set severity to "CRITICAL".
   - Fan Action: Provide highly reassuring, urgent yet calm bilingual instructions to relocate to the covered concourses.
   - Metadata: Set themeColor to "red", alertIcon to "alert", estimatedDelayMinutes to 0 (immediate action).

3. SOP-WEA-108 (Rain/Storm Advisory):
   - Triggered when weatherCondition is "Storm" or "Rain" (and NOT Lightning).
   - Staff Action: Dispatch maintenance teams to place caution signs on walkways, monitor slippery stairs.
   - Fan Action: Advise fans to walk carefully, anticipate wet seats, and expect minor delays.
   - Metadata: Set themeColor to "yellow", alertIcon to "info", estimatedDelayMinutes to 5.

4. SOP-SEC-404 (Incident Perimeter Isolation):
   - Triggered when incidentReport is provided (e.g., medical emergency, sector blockage, active hazard).
   - Staff Action: Cordon off a 20-meter perimeter, clear paths for emergency responders. Reference SOP-SEC-404. Set severity to "CRITICAL" for medical/hazard, or "WARNING" for minor blockages.
   - Fan Action: Reroute fans away from the affected sector, using positive, supportive language. Avoid causing panic.
   - Metadata: Set themeColor to "red" (or "yellow" for minor issues), alertIcon to "alert" or "warning".

5. Default Safe Flow:
   - If gateFlowRate < 85%, weatherCondition is "Clear", and there is no incident.
   - Staff Action: Standard monitoring. Cite SOP-GEN-101. Severity "INFO".
   - Fan Action: Welcoming greeting, normal flow instructions.
   - Metadata: themeColor "green", alertIcon "info", estimatedDelayMinutes is 0.

You must return a response adhering exactly to the following JSON structure:
{
  "staff_payload": {
    "recommendation": "String detailing clear actionable operations steps based on SOP",
    "severity": "INFO" | "WARNING" | "CRITICAL",
    "sopCited": "String representing the SOP code, e.g. SOP-FLOW-302"
  },
  "fan_payload": {
    "englishMessage": "Empathetic, clear, and action-oriented message for fans in English",
    "spanishMessage": "Empathetic, clear, and action-oriented message for fans in Spanish",
    "themeColor": "green" | "yellow" | "red",
    "alertIcon": "info" | "warning" | "alert",
    "estimatedDelayMinutes": number,
    "redirectGate": "String matching the suggested alternative gate, e.g. Gate C (only if applicable)"
  }
}
`;

/**
 * Analyzes stadium telemetry input using the Gemini 1.5 Flash AI model.
 *
 * Sends a structured prompt to the Gemini API requesting a dual-payload response
 * containing both staff operations recommendations and fan-facing bilingual messages.
 * If the Gemini API is unavailable (missing key, network error, quota exceeded),
 * the function automatically falls back to the deterministic rule-based engine.
 *
 * @param telemetry - The validated telemetry input from a stadium gate sensor.
 * @returns A promise resolving to the dual-payload containing staff and fan instructions.
 *
 * @example
 * ```ts
 * const payload = await analyzeTelemetry({
 *   gateId: 'Gate B',
 *   gateFlowRate: 92,
 *   weatherCondition: 'Rain',
 * });
 * console.log(payload.staff_payload.severity); // 'WARNING'
 * ```
 */
export async function analyzeTelemetry(telemetry: TelemetryInput): Promise<DualPayload> {
  if (!genAI) {
    // Return mock fallback reasoning if Gemini API Key is missing (e.g., local setup / initial runs)
    logger.warn('GEMINI_API_KEY is not defined. Using rule-based fallback reasoning.');
    return generateFallbackReasoning(telemetry);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            staff_payload: {
              type: SchemaType.OBJECT,
              properties: {
                recommendation: { type: SchemaType.STRING },
                severity: { type: SchemaType.STRING },
                sopCited: { type: SchemaType.STRING }
              },
              required: ['recommendation', 'severity', 'sopCited']
            },
            fan_payload: {
              type: SchemaType.OBJECT,
              properties: {
                englishMessage: { type: SchemaType.STRING },
                spanishMessage: { type: SchemaType.STRING },
                themeColor: { type: SchemaType.STRING },
                alertIcon: { type: SchemaType.STRING },
                estimatedDelayMinutes: { type: SchemaType.NUMBER },
                redirectGate: { type: SchemaType.STRING }
              },
              required: ['englishMessage', 'spanishMessage', 'themeColor', 'alertIcon', 'estimatedDelayMinutes']
            }
          },
          required: ['staff_payload', 'fan_payload']
        }
      }
    });

    const prompt = `Analyze this live stadium telemetry:\n${JSON.stringify(telemetry, null, 2)}\n\nEnsure the recommendation is highly detailed, professional, and references the appropriate FIFA 2026 venue SOP.\nSystem context: ${SYSTEM_INSTRUCTION}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    try {
      return JSON.parse(text) as DualPayload;
    } catch (parseError) {
      logger.error('Failed to parse Gemini JSON response, falling back to rule-based parser.', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        responsePreview: text.substring(0, 200),
      });
      return generateFallbackReasoning(telemetry);
    }
  } catch (error) {
    logger.error('Gemini API call failed, falling back to rule-based parser.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return generateFallbackReasoning(telemetry);
  }
}

/**
 * Deterministic rule-based fallback parser that evaluates telemetry against
 * FIFA 2026 Venue Standard Operating Procedures.
 *
 * This engine ensures full operational continuity when the Gemini API is
 * unavailable due to quota limits, network issues, or missing credentials.
 * Rules are evaluated in strict priority order:
 *
 * 1. Lightning (SOP-WEA-109) — highest priority, immediate evacuation
 * 2. Incident report (SOP-SEC-404) — perimeter isolation
 * 3. Gate overflow (SOP-FLOW-302) — crowd redirection, with ≥95% escalation
 * 4. Rain/Storm (SOP-WEA-108) — weather advisory
 * 5. Default normal flow (SOP-GEN-101) — standard monitoring
 *
 * @param telemetry - The validated telemetry input to evaluate.
 * @returns The dual-payload with staff and fan instructions.
 */
export function generateFallbackReasoning(telemetry: TelemetryInput): DualPayload {
  const { gateId, gateFlowRate, weatherCondition, incidentReport } = telemetry;

  // 1. Weather Lightning (SOP-WEA-109) — highest priority
  if (weatherCondition === 'Lightning') {
    return {
      staff_payload: {
        recommendation: `[WEATHER EVACUATION] Lightning detected. Invoke ${SOP_CODES.LIGHTNING_EVACUATION} immediately. Evacuate upper deck levels at ${gateId}. Move operations to indoor channels. Set warning signals.`,
        severity: SEVERITY.CRITICAL,
        sopCited: SOP_CODES.LIGHTNING_EVACUATION,
      },
      fan_payload: {
        englishMessage: 'Severe weather alert: Lightning has been detected near the stadium. For your safety, please seek immediate shelter in the covered concourses.',
        spanishMessage: 'Alerta de clima severo: Se han detectado relámpagos cerca del estadio. Por su seguridad, busque refugio de inmediato en los pasillos cubiertos.',
        themeColor: 'red',
        alertIcon: 'alert',
        estimatedDelayMinutes: ESTIMATED_DELAYS.NONE,
      },
    };
  }

  // 2. Incident Report (SOP-SEC-404)
  if (incidentReport && incidentReport.trim() !== '') {
    return {
      staff_payload: {
        recommendation: `[SECURITY/MEDICAL ALERT] Active report: "${incidentReport}". Cite ${SOP_CODES.INCIDENT_ISOLATION}. Secure a ${ISOLATION_PERIMETER_METERS}-meter perimeter at the reported location near ${gateId}. Deploy response team.`,
        severity: SEVERITY.CRITICAL,
        sopCited: SOP_CODES.INCIDENT_ISOLATION,
      },
      fan_payload: {
        englishMessage: `Safety notice: We are responding to an incident near ${gateId}. Please bypass this area and follow on-site staff directions.`,
        spanishMessage: `Aviso de seguridad: Estamos atendiendo una incidencia cerca de ${gateId}. Evite esta zona y siga las indicaciones del personal.`,
        themeColor: 'red',
        alertIcon: 'alert',
        estimatedDelayMinutes: ESTIMATED_DELAYS.INCIDENT_RESPONSE,
      },
    };
  }

  // 3. Gate Capacity Flow (SOP-FLOW-302) — with ≥95% escalation to CRITICAL
  if (gateFlowRate >= GATE_OVERFLOW_THRESHOLD) {
    const nextGate = getAdjacentGate(gateId);
    const isCritical = gateFlowRate >= GATE_CRITICAL_THRESHOLD;

    return {
      staff_payload: {
        recommendation: `[CROWD OVERFLOW] ${gateId} capacity reached ${gateFlowRate}%. Invoke ${SOP_CODES.GATE_REDIRECT}. Reroute incoming spectator traffic to ${nextGate}. Adjust signage.${isCritical ? ' CRITICAL: Near-total capacity — deploy additional crowd marshals immediately.' : ''}`,
        severity: isCritical ? SEVERITY.CRITICAL : SEVERITY.WARNING,
        sopCited: SOP_CODES.GATE_REDIRECT,
      },
      fan_payload: {
        englishMessage: `${gateId} is experiencing high crowd volume. To speed up your entry, please proceed to the adjacent ${nextGate}.`,
        spanishMessage: `La entrada ${gateId} registra un alto flujo de personas. Para ingresar más rápido, diríjase a la entrada contigua ${nextGate}.`,
        themeColor: isCritical ? 'red' : 'yellow',
        alertIcon: 'warning',
        estimatedDelayMinutes: ESTIMATED_DELAYS.GATE_REDIRECT,
        redirectGate: nextGate,
      },
    };
  }

  // 4. Weather Rain/Storm (SOP-WEA-108)
  if (weatherCondition === 'Rain' || weatherCondition === 'Storm') {
    return {
      staff_payload: {
        recommendation: `[RAIN MONITORING] Heavy rain detected. Invoke ${SOP_CODES.RAIN_ADVISORY}. Instruct janitorial crew to deploy wet-floor caution markers near entrances of ${gateId}.`,
        severity: SEVERITY.WARNING,
        sopCited: SOP_CODES.RAIN_ADVISORY,
      },
      fan_payload: {
        englishMessage: 'Weather notice: Wet conditions are reported around the stadium. Please watch your step on stairs and walkways.',
        spanishMessage: 'Aviso meteorológico: Se reportan condiciones de lluvia. Tenga cuidado al caminar por escaleras y pasillos.',
        themeColor: 'yellow',
        alertIcon: 'info',
        estimatedDelayMinutes: ESTIMATED_DELAYS.RAIN_ADVISORY,
      },
    };
  }

  // 5. Default Normal Safe Flow (SOP-GEN-101)
  return {
    staff_payload: {
      recommendation: `[NORMAL FLOW] Turnstiles operating nominally at ${gateId}. Flow capacity is at ${gateFlowRate}%. Standby monitoring under ${SOP_CODES.NORMAL_FLOW}.`,
      severity: SEVERITY.INFO,
      sopCited: SOP_CODES.NORMAL_FLOW,
    },
    fan_payload: {
      englishMessage: `Welcome to the FIFA World Cup 2026! Access via ${gateId} is clear and open. Have a great match.`,
      spanishMessage: `¡Bienvenidos a la Copa Mundial de la FIFA 2026! El acceso por ${gateId} está despejado. Disfrute del partido.`,
      themeColor: 'green',
      alertIcon: 'info',
      estimatedDelayMinutes: ESTIMATED_DELAYS.NONE,
    },
  };
}

/**
 * Returns the nearest adjacent gate for crowd redirection purposes.
 * Gates follow a circular mapping: A→B→C→D→A.
 *
 * @param currentGate - The identifier of the currently overloaded gate.
 * @returns The identifier of the recommended alternative gate.
 */
export function getAdjacentGate(currentGate: string): string {
  return ADJACENT_GATE_MAP[currentGate] || DEFAULT_FALLBACK_GATE;
}
