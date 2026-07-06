import { NextRequest, NextResponse } from 'next/server';
import { incidents } from '@/lib/db';

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

export async function PATCH(
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
