'use client';

import { useRouter, usePathname } from 'next/navigation';
import PatchLogo from './PatchLogo';

interface HeaderProps {
  incidentCount?: number;
  onNewChat?: () => void;
}

export default function Header({ incidentCount = 0, onNewChat }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function handleNewChat() {
    if (onNewChat) {
      onNewChat();
    } else {
      router.push('/');
    }
  }

  const isIncidentsActive = pathname?.startsWith('/incidents');

  return (
    <header
      data-testid="app-header"
      style={{
        height: 60,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <button
        data-testid="nav-logo-link"
        onClick={() => router.push('/')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-label="Go to home"
      >
        <PatchLogo size={32} showText={true} />
      </button>

      <nav data-testid="header-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavItem
          label="Incidents"
          isActive={isIncidentsActive}
          badge={incidentCount > 0 ? incidentCount : undefined}
          onClick={() => router.push('/incidents')}
          testId="nav-incidents-link"
        />
        <NavItem
          label="New Chat"
          isActive={false}
          onClick={handleNewChat}
          testId="nav-new-chat-btn"
        />
        <NavItem
          label="Logout"
          isActive={false}
          onClick={handleLogout}
          testId="nav-logout-btn"
        />
      </nav>
    </header>
  );
}

function NavItem({
  label,
  isActive,
  badge,
  onClick,
  testId,
}: {
  label: string;
  isActive: boolean;
  badge?: number;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 12px',
        fontSize: 14,
        fontWeight: 500,
        color: isActive ? '#DC2626' : '#374151',
        borderBottom: isActive ? '2px solid #DC2626' : '2px solid transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'color 0.15s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#DC2626';
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#374151';
      }}
    >
      {label}
      {badge !== undefined && (
        <span
          data-testid="incidents-count-badge"
          style={{
            background: '#DC2626',
            color: '#FFFFFF',
            borderRadius: '100px',
            fontSize: 10,
            fontWeight: 600,
            padding: '1px 6px',
            lineHeight: 1.5,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
