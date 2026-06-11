'use client';

import { useRouter } from 'next/navigation';
import { Incident } from '@/types';
import StatusBadge from './StatusBadge';

interface IncidentSummaryCardProps {
  incident: Incident;
  type: 'escalated' | 'resolved';
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IncidentSummaryCard({ incident, type }: IncidentSummaryCardProps) {
  const router = useRouter();

  return (
    <div
      data-testid="incident-summary-card"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>
          {incident.incidentId}
        </div>
        <StatusBadge status={incident.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        <Row label="Category" value={incident.category} />
        <Row label="Created" value={formatDateTime(incident.createdAt)} />
        {type === 'escalated' && incident.escalationDetails && (
          <>
            <Row label="Reason" value={incident.escalationDetails.reason || '-'} />
            <Row label="Support Group" value={incident.escalationDetails.supportGroup || '-'} />
            <Row label="Priority" value={incident.escalationDetails.priority || '-'} />
            <Row label="Urgency" value={incident.escalationDetails.urgency || '-'} />
            <Row label="Impact" value={incident.escalationDetails.impact || '-'} />
          </>
        )}
      </div>

      <button
        data-testid="view-incident-btn"
        className="btn-secondary"
        style={{ alignSelf: 'flex-start', marginTop: 4 }}
        onClick={() => router.push(`/incidents/${incident._id}`)}
      >
        View Incident
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 13, color: '#374151', fontWeight: 400, marginTop: 2 }}>{value}</div>
    </div>
  );
}
