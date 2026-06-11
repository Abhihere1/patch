'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import FeedbackCard from '@/components/FeedbackCard';
import { HistoryAssistantMessage } from '@/components/AssistantMessage';
import { Incident, ChatMessage } from '@/types';

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalIncidents, setTotalIncidents] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => { if (!res.ok) router.push('/login'); return res.json(); })
      .catch(() => router.push('/login'));

    fetch(`/api/incidents/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.incident) setIncident(data.incident);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/incidents')
      .then(r => r.json())
      .then(d => setTotalIncidents(d.incidents?.length || 0));
  }, [id, router]);

  function handleResumeChat() {
    if (!incident) return;
    sessionStorage.setItem('resume_incident_id', id);
    router.push('/');
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <span style={{ color: '#9CA3AF', fontSize: 14 }}>Loading...</span>
      </div>
    );
  }

  if (!incident) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <span style={{ color: '#9CA3AF', fontSize: 14 }}>Incident not found.</span>
      </div>
    );
  }

  const milestones = ['Open', 'Escalated', 'Resolved'] as const;
  const statusOrder = { Open: 0, Escalated: 1, Resolved: 2 };
  const currentOrder = statusOrder[incident.status];

  const lastMsg = incident.history[incident.history.length - 1];
  const lastUnansweredControl =
    lastMsg?.role === 'assistant' && lastMsg?.control && !lastMsg.control.answered
      ? lastMsg.control
      : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <Header incidentCount={totalIncidents} />

      <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '28px 24px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              data-testid="back-link"
              onClick={() => router.push('/incidents')}
              style={{
                background: 'none',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 13,
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ← Incidents
            </button>
            <StatusBadge status={incident.status} />
          </div>
          {incident.status === 'Open' && (
            <button
              data-testid="resume-chat-btn"
              className="btn-primary"
              onClick={handleResumeChat}
            >
              Resume Chat
            </button>
          )}
        </div>

        <h1
          data-testid="incident-detail-heading"
          style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 24 }}
        >
          {incident.incidentId}
        </h1>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Conversation History */}
            <section
              data-testid="conversation-history-card"
              className="card"
              style={{ padding: 0 }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Conversation History</h2>
              </div>
              <div
                data-testid="conversation-history-scroll"
                style={{
                  maxHeight: 520,
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {incident.history.length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: 13 }}>No messages yet.</p>
                ) : (
                  incident.history.map((msg: ChatMessage, idx: number) => {
                    const isLast = idx === incident.history.length - 1;
                    if (msg.role === 'user') {
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div className="bubble-user">{msg.content}</div>
                        </div>
                      );
                    }
                    const isUnanswered = isLast && !!lastUnansweredControl && incident.status === 'Open';
                    return (
                      <HistoryAssistantMessage
                        key={idx}
                        message={msg}
                        isUnanswered={isUnanswered}
                        onOptionSelect={() => {
                          sessionStorage.setItem('resume_incident_id', id);
                          router.push('/');
                          // Navigate to main page; resume flow will restore the chat state
                        }}
                      />
                    );
                  })
                )}
              </div>
            </section>

            {/* Progress Card */}
            <section data-testid="progress-card" className="card">
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Progress</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {milestones.map((milestone, idx) => {
                  const mOrder = statusOrder[milestone];
                  const isCompleted = mOrder <= currentOrder;
                  const isSkipped = milestone === 'Escalated' && incident.status === 'Resolved' && !incident.escalationDetails;
                  return (
                    <div key={milestone} style={{ display: 'flex', alignItems: 'center', flex: idx < milestones.length - 1 ? 1 : 'initial' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div
                          data-testid={`progress-milestone-${milestone.toLowerCase()}`}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isCompleted && !isSkipped ? '#DC2626' : '#FFFFFF',
                            border: `2px solid ${isCompleted && !isSkipped ? '#DC2626' : '#D1D5DB'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isCompleted && !isSkipped && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 7l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 500, color: isCompleted && !isSkipped ? '#DC2626' : '#9CA3AF' }}>
                          {milestone}
                        </span>
                      </div>
                      {idx < milestones.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            background: currentOrder > mOrder && !(milestone === 'Escalated' && isSkipped) ? '#DC2626' : '#E5E7EB',
                            margin: '0 8px',
                            marginBottom: 24,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Status Details Card */}
            {(incident.status === 'Escalated' || incident.status === 'Resolved') && (
              <section data-testid="status-details-card" className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
                  {incident.status === 'Escalated' ? 'Escalation Details' : 'Resolution Details'}
                </h2>

                {incident.status === 'Escalated' && incident.escalationDetails && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <DetailRow label="Reason" value={incident.escalationDetails.reason || '-'} />
                    <DetailRow label="Support Group" value={incident.escalationDetails.supportGroup || '-'} />
                    <DetailRow label="Priority" value={incident.escalationDetails.priority || '-'} />
                    <DetailRow label="Urgency" value={incident.escalationDetails.urgency || '-'} />
                    <DetailRow label="Impact" value={incident.escalationDetails.impact || '-'} />
                  </div>
                )}

                {incident.status === 'Resolved' && incident.resolutionDetails && (
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                    {incident.resolutionDetails.summary || 'Issue resolved successfully.'}
                  </div>
                )}

                {/* Feedback Section */}
                <FeedbackCard
                  incidentId={id}
                  existingFeedback={incident.feedback}
                  embedded
                />
              </section>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Case Details */}
            <section data-testid="case-details-card" className="card">
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Case Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <DetailRow label="Category" value={incident.category} />
                <DetailRow label="Status" value={<StatusBadge status={incident.status} />} />
                <DetailRow label="Created" value={formatDateTime(incident.createdAt)} />
                <DetailRow label="Updated" value={formatDateTime(incident.updatedAt)} />
                {incident.kbFiles && incident.kbFiles.length > 0 && (
                  <DetailRow label="KB Files" value={incident.kbFiles.join(', ')} />
                )}
              </div>
            </section>

            {/* Identifiers */}
            <section data-testid="identifiers-card" className="card">
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Identifiers</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <CopyRow label="Incident ID" value={incident.incidentId} />
                <CopyRow label="Session ID" value={id} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: '#374151' }}>{value}</div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <code style={{ fontSize: 12, color: '#374151', background: '#F3F4F6', borderRadius: 6, padding: '4px 8px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </code>
        <button
          data-testid={`copy-${label.toLowerCase().replace(' ', '-')}-btn`}
          onClick={handleCopy}
          style={{
            background: 'none',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: 11,
            color: copied ? '#10B981' : '#6B7280',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
