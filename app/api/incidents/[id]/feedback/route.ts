import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getIncident, saveFeedback } from '@/lib/incidents';

export async function POST(
  req: NextRequest,
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

  const { rating, comment } = await req.json();

  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: 'Rating must be a number between 1 and 5.' }, { status: 400 });
  }

  await saveFeedback(id, { rating, comment: comment || '' });
  return NextResponse.json({ message: 'Feedback saved.' });
}
