'use client';

interface StatusBadgeProps {
  status: 'Open' | 'Escalated' | 'Resolved';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const classMap = {
    Open: 'badge badge-open',
    Escalated: 'badge badge-escalated',
    Resolved: 'badge badge-resolved',
  };

  return (
    <span data-testid={`status-badge-${status.toLowerCase()}`} className={classMap[status]}>
      {status}
    </span>
  );
}
