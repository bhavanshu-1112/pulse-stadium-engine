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
    *   Venue Standard Operating Procedure (SOP) preset launchpad with 5 predefined scenarios.
    *   Approval broadcast toggle cards with real-time status updates.
    *   Visibility-aware auto-polling that pauses when the browser tab is hidden.
*   **Fan Companion View (`/fan`):**
    *   iPhone-frame-simulated mobile companion client.
    *   Auto-polling (3-second interval) to update approved directions in real time.
    *   Bilingual English / Spanish toggles.
    *   Dynamic card layouts styled relative to severity metadata.
*   **Fail-safe Fallback Engine:** Integrated rule-based parser that handles request timeouts, network limits, or invalid API credentials seamlessly.
*   **Security Hardened:** Server-side only API key handling, input sanitization (XSS prevention), and security headers (X-Frame-Options, CSP, Referrer-Policy).
*   **Accessibility:** Skip-to-content navigation, ARIA live regions, `prefers-reduced-motion` support, keyboard-navigable UI, and semantic HTML.
*   **Jest Verification Suite:** 33 tests across 2 test suites validating the telemetry evaluator, parser rules, and input validation against contract specifications.

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
├── __tests__/
│   ├── schema.test.ts       # Gemini fallback parser & SOP rule tests (13 tests)
│   └── validation.test.ts   # Input validation & sanitization tests (20 tests)
├── app/
│   ├── api/
│   │   ├── incidents/       # GET (retrieve lists) & POST (dispatch telemetry)
│   │   │   └── [id]/approve # POST/PATCH (broadcast redirects)
│   │   └── reasoning/       # Core server-side Gemini API pipeline
│   ├── fan/                 # Fan Mobile View page
│   ├── operator/            # Operations Dashboard page
│   ├── error.tsx            # Global error boundary (graceful crash recovery)
│   ├── not-found.tsx        # Custom branded 404 page
│   ├── globals.css          # Animations, reduced-motion, focus-visible styles
│   ├── layout.tsx           # Root layout with SEO metadata & skip-to-content
│   └── page.tsx             # Landing launchpad index
├── lib/
│   ├── constants.ts         # Centralized configuration (thresholds, SOP codes, enums)
│   ├── db.ts                # Persistent in-memory incident array
│   ├── gemini.ts            # Gemini API client wrapper & SOP rules fallback engine
│   └── validation.ts        # Shared input validation & XSS sanitization
└── types/
    └── index.ts             # Strict TypeScript interface definitions
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

## 📋 Venue Standard Operating Procedures (SOPs)

The AI reasoning engine evaluates telemetry inputs against these preset rules (in priority order):

1.  **SOP-WEA-109 (Severe Weather Evacuation):** Triggers on "Lightning". Mandates upper bowl evacuations and concourse shielding. Severity: `CRITICAL`.
2.  **SOP-SEC-404 (Perimeter Isolation):** Triggers when custom incident logs (blockages, hazards, or medical reports) are submitted. Severity: `CRITICAL`.
3.  **SOP-FLOW-302 (Gate Capacity Redirection):** Triggers when gate capacity ≥ 85%. Reroutes traffic to adjacent gates. Escalates to `CRITICAL` at ≥ 95%.
4.  **SOP-WEA-108 (Rain/Storm Advisory):** Triggers on rain/storm conditions. Directs caution markers deployment. Severity: `WARNING`.
5.  **SOP-GEN-101 (Default Safe Flow):** Active when all conditions are nominal. Standard monitoring. Severity: `INFO`.

---

## 🔒 Security

*   API keys are handled exclusively server-side via Next.js API routes
*   Input sanitization strips HTML tags to prevent XSS injection
*   Security headers configured via `next.config.mjs`:
    *   `X-Frame-Options: DENY`
    *   `X-Content-Type-Options: nosniff`
    *   `Referrer-Policy: strict-origin-when-cross-origin`
    *   `Permissions-Policy: camera=(), microphone=(), geolocation=()`
*   `X-Powered-By` header removed to reduce server fingerprinting

---

## ♿ Accessibility

*   Skip-to-content link for keyboard and screen reader users
*   ARIA live regions for dynamic content updates (incident feed, alerts)
*   `prefers-reduced-motion` media query disables all animations
*   `focus-visible` outline styling for keyboard navigation
*   Semantic HTML with proper heading hierarchy, landmarks, and roles
*   Bilingual support (English / Spanish) for fan-facing content
