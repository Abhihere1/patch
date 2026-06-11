import { getDb } from './mongodb';
import { Incident, ChatMessage, EscalationDetails, ResolutionDetails, Feedback } from '@/types';
import { ObjectId } from 'mongodb';

const COLLECTION = 'Patch Transactions';

function generateIncidentId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INC-${timestamp}-${random}`;
}

export async function createIncident(userId: string, category: string, kbFiles: string[]): Promise<Incident> {
  const db = await getDb();
  const now = new Date();
  const incident: Omit<Incident, '_id'> = {
    incidentId: generateIncidentId(),
    userId,
    status: 'Open',
    category,
    kbFiles,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection(COLLECTION).insertOne(incident);
  return { ...incident, _id: result.insertedId.toString() };
}

export async function getIncident(id: string): Promise<Incident | null> {
  const db = await getDb();
  try {
    const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return { ...doc, _id: doc._id.toString() } as Incident;
  } catch {
    return null;
  }
}

export async function getIncidentsByUser(userId: string): Promise<Incident[]> {
  const db = await getDb();
  const docs = await db.collection(COLLECTION)
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(d => ({ ...d, _id: d._id.toString() })) as Incident[];
}

export async function appendMessage(incidentId: string, message: ChatMessage): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(incidentId) },
    {
      $push: { history: message as never },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function updateIncidentStatus(
  incidentId: string,
  status: 'Open' | 'Escalated' | 'Resolved',
  details?: { escalationDetails?: EscalationDetails; resolutionDetails?: ResolutionDetails }
): Promise<void> {
  const db = await getDb();
  const update: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };
  if (details?.escalationDetails) update.escalationDetails = details.escalationDetails;
  if (details?.resolutionDetails) update.resolutionDetails = details.resolutionDetails;

  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(incidentId) },
    { $set: update }
  );
}

export async function saveFeedback(incidentId: string, feedback: Feedback): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(incidentId) },
    {
      $set: {
        feedback: { ...feedback, submittedAt: new Date() },
        updatedAt: new Date(),
      },
    }
  );
}
