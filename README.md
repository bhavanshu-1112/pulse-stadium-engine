# Pulse: FIFA World Cup 2026 GenAI Stadium Operations Engine

Pulse is a full-stack, GenAI-enabled stadium operations and crowd management engine designed for the FIFA World Cup 2026. Built with Next.js 14, TypeScript, and Tailwind CSS, the application orchestrates crowd flow, weather emergencies, and localized incidents using a secure server-side Gemini AI reasoning pipeline.

---

## 🚀 Key Features

*   **"One Call, Dual Output" Pipeline:** Minimizes latency by requesting a single, schema-compliant JSON payload from Gemini 1.5 containing distinct instructions for:
    *   **Staff Payload:** Professional, actionable SOP steps and severity levels (`INFO`, `WARNING`, `CRITICAL`).
    *   **Fan Payload:** Empathic bilingual instructions (English and Spanish) and UI metadata.
*   **Operational Control Center (`/operator`):**
    *   Sleek, dark-mode operations console dashboard.
    *   Interactive Live Telemetry Generator with fields for Gate ID, Capacity flow, Weather condition, and Incident reports.
    *   Venue Standard Operating Procedure (SOP) preset launchpad.
    *   Approval broadcast toggle cards.
*   **Fan Companion View (`/fan`):**
    *   iPhone-frame-simulated mobile companion client.
    *   Auto-polling (3-second interval) to update approved directions in real time.
    *   Bilingual English / Spanish toggles.
    *   Dynamic card layouts styled relative to severity metadata.
*   **Fail-safe Fallback Engine:** Integrated rule-based parser that handles request timeouts, network limits, or invalid API credentials seamlessly.
*   **Jest Verification Suite:** Test coverage validating the telemetry evaluator and parser rules against contract specifications.

---

## 🛠️ Tech Stack

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS & Lucide Icons
*   **AI Integration:** `@google/generative-ai` (Gemini 1.5 Flash)
*   **Testing:** Jest & `ts-jest`

---

## 📁 Project Structure

```text
src/
├── __tests__/         # Jest schema and parsing test configurations
├── app/
│   ├── api/
│   │   ├── incidents/       # GET (retrieve lists) & POST (dispatch telemetry)
│   │   │   └── [id]/approve # POST/PATCH (broadcast redirects)
│   │   └── reasoning/       # Core server-side Gemini API pipeline
│   ├── fan/                 # Fan Mobile View page
│   ├── operator/            # Operations Dashboard page
│   ├── layout.tsx
│   └── page.tsx             # Landing launchpad index
├── lib/
│   ├── db.ts                # Persistent in-memory incident array
│   └── gemini.ts            # Gemini API client wrapper & SOP rules logic
└── types/
    └── index.ts             # Strict TypeScript types
```

---

## ⚙️ Setup and Installation

### 1. Clone the project and install dependencies

```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Gemini API Key:

```text
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

> [!NOTE]
> If no API Key is supplied or if there are credential mismatch issues, the system automatically redirects telemetry to the integrated local rule engine, maintaining complete operational status.

---

## 🏃 Running the Application

### Start Development Server

```bash
npm run dev
```

*   **Index Launchpad:** [http://localhost:3000](http://localhost:3000)
*   **Staff Operations Console:** [http://localhost:3000/operator](http://localhost:3000/operator)
*   **Fan Companion Client:** [http://localhost:3000/fan](http://localhost:3000/fan)

### Run Automated Tests

```bash
npm run test
```

### Compile Production Build

```bash
npm run build
```

---

## 📋 Mock Venue Standard Operating Procedures (SOPs)

The AI reasoning engine evaluates telemetry inputs against these preset rules:
1.  **SOP-FLOW-302 (Gate Capacity Redirection):** Triggers when a gate capacity matches or exceeds 85%. Reroutes traffic to adjacent gates.
2.  **SOP-WEA-109 (Severe Weather Shelling):** Triggers on "Lightning". Mandates upper bowl evacuations and concourse shielding.
3.  **SOP-WEA-108 (Rain/Storm Advisory):** Triggers on rain/storm. Directs caution markers deployment.
4.  **SOP-SEC-404 (Perimeter Isolation):** Triggers when custom incident logs (blockages, hazards, or medical reports) are submitted.
