import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getIncident } from '@/lib/incidents';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const incident = await getIncident(id);

  if (!incident) {
    return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });
  }

  if (incident.userId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  return NextResponse.json({ incident });
}
