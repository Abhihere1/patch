'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { Incident } from '@/types';

type FilterTab = 'All' | 'Open' | 'Escalated' | 'Resolved';

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => { if (!res.ok) router.push('/login'); return res.json(); })
      .catch(() => router.push('/login'));

    fetch('/api/incidents')
      .then(res => res.json())
      .then(data => {
        setIncidents(data.incidents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const filtered = activeTab === 'All' ? incidents : incidents.filter(i => i.status === activeTab);
  const tabs: FilterTab[] = ['All', 'Open', 'Escalated', 'Resolved'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <Header incidentCount={incidents.length} />

      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 data-testid="incidents-page-heading" style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>
            Incidents
          </h1>
        </div>

        {/* Filter tabs */}
        <div
          data-testid="incidents-filter-tabs"
          style={{
            display: 'flex',
            gap: 4,
            borderBottom: '1px solid #E5E7EB',
            marginBottom: 24,
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab}
              data-testid={`filter-tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                color: activeTab === tab ? '#DC2626' : '#6B7280',
                borderBottom: `2px solid ${activeTab === tab ? '#DC2626' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div data-testid="no-incidents-message" style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: 14 }}>
            No incidents yet.
          </div>
        ) : (
          <div
            data-testid="incidents-list"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {filtered.map((incident, idx) => (
              <div
                key={incident._id}
                data-testid={`incident-row-${idx}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 120px 100px 130px 100px 80px',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                  gap: 16,
                }}
              >
                <div>
                  <div data-testid={`incident-id-${idx}`} style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
                    {incident.incidentId}
                  </div>
                </div>
                <div data-testid={`incident-category-${idx}`} style={{ fontSize: 13, color: '#6B7280' }}>
                  {incident.category}
                </div>
                <div>
                  <StatusBadge status={incident.status} />
                </div>
                <div data-testid={`incident-date-${idx}`} style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {formatDate(incident.createdAt)}
                </div>
                <div data-testid={`incident-age-${idx}`} style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {timeAgo(incident.createdAt)}
                </div>
                <div>
                  <button
                    data-testid={`incident-view-btn-${idx}`}
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                    onClick={() => router.push(`/incidents/${incident._id}`)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
