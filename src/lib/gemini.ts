import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { TelemetryInput, DualPayload } from '../types';

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

export async function analyzeTelemetry(telemetry: TelemetryInput): Promise<DualPayload> {
  if (!genAI) {
    // Return mock fallback reasoning if Gemini API Key is missing (e.g., local setup / initial runs)
    console.warn("GEMINI_API_KEY is not defined. Using rule-based fallback reasoning.");
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

    const prompt = `Analyze this live stadium telemetry:
${JSON.stringify(telemetry, null, 2)}

Ensure the recommendation is highly detailed, professional, and references the appropriate FIFA 2026 venue SOP.
System context: ${SYSTEM_INSTRUCTION}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    return JSON.parse(text) as DualPayload;
  } catch (error) {
    console.error("Gemini API call failed, falling back to rule-based parser:", error);
    return generateFallbackReasoning(telemetry);
  }
}

// Rule-based fallback parser to ensure system functions even under API quotas or configuration gaps
function generateFallbackReasoning(telemetry: TelemetryInput): DualPayload {
  const { gateId, gateFlowRate, weatherCondition, incidentReport } = telemetry;

  // 1. Weather Lightning (SOP-WEA-109)
  if (weatherCondition === 'Lightning') {
    return {
      staff_payload: {
        recommendation: `[WEATHER EVACUATION] Lightening detected. Invoke SOP-WEA-109 immediately. Evacuate upper deck levels at ${gateId}. Move operations to indoor channels. Set warning signals.`,
        severity: 'CRITICAL',
        sopCited: 'SOP-WEA-109'
      },
      fan_payload: {
        englishMessage: 'Severe weather alert: Lightning has been detected near the stadium. For your safety, please seek immediate shelter in the covered concourses.',
        spanishMessage: 'Alerta de clima severo: Se han detectado relámpagos cerca del estadio. Por su seguridad, busque refugio de inmediato en los pasillos cubiertos.',
        themeColor: 'red',
        alertIcon: 'alert',
        estimatedDelayMinutes: 0
      }
    };
  }

  // 2. Incident Report (SOP-SEC-404)
  if (incidentReport && incidentReport.trim() !== '') {
    return {
      staff_payload: {
        recommendation: `[SECURITY/MEDICAL ALERT] Active report: "${incidentReport}". Cite SOP-SEC-404. Secure a 20-meter perimeter at the reported location near ${gateId}. Deploy response team.`,
        severity: 'CRITICAL',
        sopCited: 'SOP-SEC-404'
      },
      fan_payload: {
        englishMessage: `Safety notice: We are responding to an incident near ${gateId}. Please bypass this area and follow on-site staff directions.`,
        spanishMessage: `Aviso de seguridad: Estamos atendiendo una incidencia cerca de ${gateId}. Evite esta zona y siga las indicaciones del personal.`,
        themeColor: 'red',
        alertIcon: 'alert',
        estimatedDelayMinutes: 15
      }
    };
  }

  // 3. Gate Capacity Flow (SOP-FLOW-302)
  if (gateFlowRate >= 85) {
    const nextGate = getAdjacentGate(gateId);
    return {
      staff_payload: {
        recommendation: `[CROWD OVERFLOW] ${gateId} capacity reached ${gateFlowRate}%. Invoke SOP-FLOW-302. Reroute incoming spectator traffic to ${nextGate}. Adjust signage.`,
        severity: 'WARNING',
        sopCited: 'SOP-FLOW-302'
      },
      fan_payload: {
        englishMessage: `${gateId} is experiencing high crowd volume. To speed up your entry, please proceed to the adjacent ${nextGate}.`,
        spanishMessage: `La entrada ${gateId} registra un alto flujo de personas. Para ingresar más rápido, diríjase a la entrada contigua ${nextGate}.`,
        themeColor: 'yellow',
        alertIcon: 'warning',
        estimatedDelayMinutes: 12,
        redirectGate: nextGate
      }
    };
  }

  // 4. Weather Rain/Storm (SOP-WEA-108)
  if (weatherCondition === 'Rain' || weatherCondition === 'Storm') {
    return {
      staff_payload: {
        recommendation: `[RAIN MONITORING] Heavy rain detected. Invoke SOP-WEA-108. Instruct janitorial crew to deploy wet-floor caution markers near entrances of ${gateId}.`,
        severity: 'WARNING',
        sopCited: 'SOP-WEA-108'
      },
      fan_payload: {
        englishMessage: 'Weather notice: Wet conditions are reported around the stadium. Please watch your step on stairs and walkways.',
        spanishMessage: 'Aviso meteorológico: Se reportan condiciones de lluvia. Tenga cuidado al caminar por escaleras y pasillos.',
        themeColor: 'yellow',
        alertIcon: 'info',
        estimatedDelayMinutes: 5
      }
    };
  }

  // 5. Default Normal Safe Flow (SOP-GEN-101)
  return {
    staff_payload: {
      recommendation: `[NORMAL FLOW] Turnstiles operating nominally at ${gateId}. Flow capacity is at ${gateFlowRate}%. Standby monitoring under SOP-GEN-101.`,
      severity: 'INFO',
      sopCited: 'SOP-GEN-101'
    },
    fan_payload: {
      englishMessage: `Welcome to the FIFA World Cup 2026! Access via ${gateId} is clear and open. Have a great match.`,
      spanishMessage: `¡Bienvenidos a la Copa Mundial de la FIFA 2026! El acceso por ${gateId} está despejado. Disfrute del partido.`,
      themeColor: 'green',
      alertIcon: 'info',
      estimatedDelayMinutes: 0
    }
  };
}

function getAdjacentGate(currentGate: string): string {
  const mapping: { [key: string]: string } = {
    'Gate A': 'Gate B',
    'Gate B': 'Gate C',
    'Gate C': 'Gate D',
    'Gate D': 'Gate A'
  };
  return mapping[currentGate] || 'Gate B';
}
