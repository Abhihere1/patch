'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AssistantMessage from '@/components/AssistantMessage';
import FeedbackCard from '@/components/FeedbackCard';
import IncidentSummaryCard from '@/components/IncidentSummaryCard';
import StatusBadge from '@/components/StatusBadge';
import { ChatMessage, Incident, LLMResponse } from '@/types';

interface SessionUser {
  userId: string;
  email: string;
  username: string;
}

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [incidentCount, setIncidentCount] = useState(0);
  const [vdiKbAvailable, setVdiKbAvailable] = useState<boolean | null>(null);

  const [chatMode, setChatMode] = useState<'landing' | 'chat'>('landing');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [composerValue, setComposerValue] = useState('');
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<'Open' | 'Escalated' | 'Resolved'>('Open');
  const [finalLlmResponse, setFinalLlmResponse] = useState<LLMResponse | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/incidents')
      .then(res => res.json())
      .then(data => setIncidentCount(data.incidents?.length || 0))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/kb/status')
      .then(res => res.json())
      .then(data => setVdiKbAvailable(data.vdi === true))
      .catch(() => setVdiKbAvailable(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const resumeId = sessionStorage.getItem('resume_incident_id');
    if (!resumeId) return;
    sessionStorage.removeItem('resume_incident_id');

    fetch(`/api/incidents/${resumeId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.incident) return;
        const incident: Incident = data.incident;
        setActiveIncident(incident);
        setIncidentId(resumeId);
        setActiveCategory(incident.category);
        setChatStatus(incident.status);
        setMessages(incident.history || []);
        setChatMode('chat');
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const refreshIncident = useCallback((id: string) => {
    fetch(`/api/incidents/${id}`)
      .then(r => r.json())
      .then(d => { if (d.incident) setActiveIncident(d.incident); })
      .catch(() => {});
  }, []);

  const sendMessage = useCallback(async (text: string, category?: string) => {
    if (isTyping) return;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setComposerValue('');
    setIsTyping(true);

    const cat = category || activeCategory;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          category: cat,
          incidentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.error || 'Something went wrong.', timestamp: new Date() },
        ]);
        setIsTyping(false);
        return;
      }

      const assistantMsg: ChatMessage = data.message;

      if (!incidentId) {
        setIncidentId(data.incidentId);
        setActiveCategory(cat);
        fetch('/api/incidents')
          .then(r => r.json())
          .then(d => setIncidentCount(d.incidents?.length || 0));
      }

      if (data.status) setChatStatus(data.status);
      if (data.llmResponse) setFinalLlmResponse(data.llmResponse);

      setMessages(prev => [...prev, assistantMsg]);
      setChatMode('chat');

      if (data.incidentId) {
        refreshIncident(data.incidentId);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, activeCategory, incidentId, refreshIncident]);

  function handleTileClick(category: string) {
    setActiveCategory(category);
    sendMessage(`I have a problem with my ${category}`, category);
  }

  function handleNewChat() {
    setChatMode('landing');
    setMessages([]);
    setActiveIncident(null);
    setActiveCategory(null);
    setIncidentId(null);
    setChatStatus('Open');
    setFinalLlmResponse(null);
    setComposerValue('');
  }

  function handleOptionSelect(option: string) {
    setMessages(prev => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === 'assistant' && updated[i].control) {
          updated[i] = { ...updated[i], control: { ...updated[i].control!, answered: true } };
          break;
        }
      }
      return updated;
    });
    sendMessage(option);
  }

  function handleFormSubmit(data: Record<number, Record<string, string>>) {
    setMessages(prev => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === 'assistant' && updated[i].control) {
          updated[i] = { ...updated[i], control: { ...updated[i].control!, answered: true } };
          break;
        }
      }
      return updated;
    });
    const formText = Object.entries(data)
      .map(([cardIdx, fields]) =>
        `Device ${Number(cardIdx) + 1}: ${Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(', ')}`
      )
      .join(' | ');
    sendMessage(formText);
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && composerValue.trim()) sendMessage(composerValue);
    }
  }

  const chatEnded = chatStatus === 'Escalated' || chatStatus === 'Resolved';
  const displayName = user?.username || user?.email?.split('@')[0] || 'there';

  if (!user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <span style={{ fontSize: 14, color: '#9CA3AF' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <Header incidentCount={incidentCount} onNewChat={handleNewChat} />

      <main
        data-testid="main-content"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
      >
        {chatMode === 'landing' ? (
          <LandingView
            displayName={displayName}
            vdiKbAvailable={vdiKbAvailable}
            composerValue={composerValue}
            onComposerChange={setComposerValue}
            onComposerKeyDown={handleComposerKeyDown}
            onComposerSubmit={() => { if (composerValue.trim()) sendMessage(composerValue); }}
            onTileClick={handleTileClick}
            isTyping={isTyping}
          />
        ) : (
          <ChatView
            messages={messages}
            isTyping={isTyping}
            chatStatus={chatStatus}
            chatEnded={chatEnded}
            activeIncident={activeIncident}
            incidentId={incidentId}
            composerValue={composerValue}
            onComposerChange={setComposerValue}
            onComposerKeyDown={handleComposerKeyDown}
            onComposerSubmit={() => { if (composerValue.trim() && !isTyping) sendMessage(composerValue); }}
            onOptionSelect={handleOptionSelect}
            onFormSubmit={handleFormSubmit}
            messagesEndRef={messagesEndRef}
            finalLlmResponse={finalLlmResponse}
          />
        )}
      </main>
    </div>
  );
}

function LandingView({
  displayName,
  vdiKbAvailable,
  composerValue,
  onComposerChange,
  onComposerKeyDown,
  onComposerSubmit,
  onTileClick,
  isTyping,
}: {
  displayName: string;
  vdiKbAvailable: boolean | null;
  composerValue: string;
  onComposerChange: (v: string) => void;
  onComposerKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onComposerSubmit: () => void;
  onTileClick: (category: string) => void;
  isTyping: boolean;
}) {
  return (
    <div
      data-testid="landing-view"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          background: 'radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 65%)',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div
          data-testid="hero-patch-mark"
          style={{
            width: 64,
            height: 64,
            background: '#DC2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm1-9H9v4H7l3 3 3-3h-2V7z" fill="white" />
          </svg>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1
            data-testid="hero-heading"
            style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: 8 }}
          >
            Welcome to the Discount Tire Information Center,{' '}
            <span style={{ color: '#DC2626' }}>{displayName}</span>.
          </h1>
          <p
            data-testid="hero-subheading"
            style={{ fontSize: 16, color: '#9CA3AF', fontWeight: 400 }}
          >
            My name is Patch. Let&apos;s get you taken care of.
          </p>
        </div>

        <div data-testid="vdi-tile-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <VdiTile kbAvailable={vdiKbAvailable} onClick={() => onTileClick('VDI')} />
        </div>

        <LandingComposer
          value={composerValue}
          onChange={onComposerChange}
          onKeyDown={onComposerKeyDown}
          onSubmit={onComposerSubmit}
          disabled={isTyping}
        />
      </div>
    </div>
  );
}

function VdiTile({ kbAvailable, onClick }: { kbAvailable: boolean | null; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      data-testid="vdi-tile"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hovered ? '#DC2626' : '#E5E7EB'}`,
        borderRadius: 16,
        padding: '28px 40px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        boxShadow: hovered ? '0 4px 16px rgba(220,38,38,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
        minWidth: 200,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          background: hovered ? '#FEE2E2' : '#F3F4F6',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke={hovered ? '#DC2626' : '#6B7280'} strokeWidth="1.5" />
          <path d="M8 21h8M12 17v4" stroke={hovered ? '#DC2626' : '#6B7280'} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div
          data-testid="vdi-tile-label"
          style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 6 }}
        >
          VDI Support
        </div>
        {kbAvailable !== null && (
          <span
            data-testid="vdi-kb-badge"
            className={`badge ${kbAvailable ? 'badge-resolved' : 'badge-escalated'}`}
          >
            {kbAvailable ? 'KB Available' : 'KB Missing'}
          </span>
        )}
      </div>
    </button>
  );
}

function LandingComposer({
  value,
  onChange,
  onKeyDown,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div
      data-testid="landing-composer"
      style={{
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        padding: 12,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <textarea
        data-testid="landing-composer-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder="Describe your issue or select a category above..."
        rows={2}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontSize: 14,
          fontFamily: 'inherit',
          color: '#111827',
          background: 'transparent',
          lineHeight: 1.5,
        }}
      />
      <button
        data-testid="landing-composer-send-btn"
        className="btn-primary"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        style={{ padding: '8px 16px', minWidth: 72 }}
      >
        Send
      </button>
    </div>
  );
}

function ChatView({
  messages,
  isTyping,
  chatStatus,
  chatEnded,
  activeIncident,
  incidentId,
  composerValue,
  onComposerChange,
  onComposerKeyDown,
  onComposerSubmit,
  onOptionSelect,
  onFormSubmit,
  messagesEndRef,
}: {
  messages: ChatMessage[];
  isTyping: boolean;
  chatStatus: 'Open' | 'Escalated' | 'Resolved';
  chatEnded: boolean;
  activeIncident: Incident | null;
  incidentId: string | null;
  composerValue: string;
  onComposerChange: (v: string) => void;
  onComposerKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onComposerSubmit: () => void;
  onOptionSelect: (option: string) => void;
  onFormSubmit: (data: Record<number, Record<string, string>>) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  finalLlmResponse: LLMResponse | null;
}) {
  return (
    <div
      data-testid="chat-view"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: 960,
        width: '100%',
        margin: '0 auto',
        padding: '0 24px',
      }}
    >
      {activeIncident && (
        <div
          data-testid="incident-header"
          style={{
            padding: '12px 0',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <span data-testid="incident-header-id" style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>
            {activeIncident.incidentId}
          </span>
          <span style={{ color: '#D1D5DB' }}>·</span>
          <span data-testid="incident-header-category" style={{ fontSize: 13, color: '#9CA3AF' }}>
            {activeIncident.category}
          </span>
          <StatusBadge status={chatStatus} />
        </div>
      )}

      <div
        data-testid="chat-messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1;
          if (msg.role === 'user') {
            return (
              <div key={idx} data-testid="user-message" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div className="bubble-user">{msg.content}</div>
              </div>
            );
          }
          const isFinalMsg = chatEnded && isLast;
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AssistantMessage
                message={msg}
                isLast={isLast}
                onOptionSelect={onOptionSelect}
                onFormSubmit={onFormSubmit}
                isTyping={isTyping}
                controlDisabled={chatEnded}
              />
              {isFinalMsg && activeIncident && (
                <>
                  <IncidentSummaryCard
                    incident={activeIncident}
                    type={chatStatus === 'Escalated' ? 'escalated' : 'resolved'}
                  />
                  {incidentId && (
                    <FeedbackCard
                      incidentId={incidentId}
                      existingFeedback={activeIncident.feedback}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div data-testid="typing-indicator" style={{ maxWidth: '80%' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Patch
            </span>
            <div className="bubble-assistant" style={{ display: 'inline-flex', gap: 5, padding: '14px 18px' }}>
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        data-testid="chat-composer-container"
        style={{
          flexShrink: 0,
          padding: '12px 0 20px',
          borderTop: '1px solid #E5E7EB',
          background: '#F9FAFB',
        }}
      >
        {chatEnded ? (
          <div
            data-testid="chat-ended-message"
            style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '12px 0' }}
          >
            This conversation has ended.
          </div>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 14,
              padding: 12,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <textarea
              data-testid="chat-composer-input"
              value={composerValue}
              onChange={e => onComposerChange(e.target.value)}
              onKeyDown={onComposerKeyDown}
              disabled={isTyping}
              placeholder="Type a message..."
              rows={2}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 14,
                fontFamily: 'inherit',
                color: '#111827',
                background: 'transparent',
                lineHeight: 1.5,
              }}
            />
            <button
              data-testid="chat-composer-send-btn"
              className="btn-primary"
              onClick={onComposerSubmit}
              disabled={isTyping || !composerValue.trim()}
              style={{ padding: '8px 16px', minWidth: 72 }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
