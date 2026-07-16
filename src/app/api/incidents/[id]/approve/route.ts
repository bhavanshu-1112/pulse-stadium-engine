/**
 * @fileoverview API route for approving incidents for fan broadcast.
 *
 * - `POST /api/incidents/[id]/approve` — Sets incident status to 'approved'.
 * - `PATCH /api/incidents/[id]/approve` — Alias for POST (idempotent operation).
 *
 * Once approved, the incident's fan payload becomes visible on the
 * Fan Companion mobile view via polling.
 *
 * @module api/incidents/[id]/approve
 */

import { NextRequest, NextResponse } from 'next/server';
import { incidents } from '@/lib/db';

/**
 * Finds an incident by ID and sets its status to 'approved'.
 *
 * @param id - The unique identifier of the incident to approve.
 * @returns The updated incident object, or null if not found.
 */
async function approveIncident(id: string) {
  const incidentIndex = incidents.findIndex((inc) => inc.id === id);

  if (incidentIndex === -1) {
    return null;
  }

  // Set the approval status to approved
  incidents[incidentIndex].status = 'approved';
  return incidents[incidentIndex];
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await approveIncident(params.id);
    if (!updated) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/** PATCH is an idempotent alias for the POST approval handler. */
export { POST as PATCH };
