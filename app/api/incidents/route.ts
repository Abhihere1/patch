import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getIncidentsByUser } from '@/lib/incidents';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const incidents = await getIncidentsByUser(session.userId);
  return NextResponse.json({ incidents });
}
