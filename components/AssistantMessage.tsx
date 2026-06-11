'use client';

import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/types';
import DynamicControls from './DynamicControls';

interface AssistantMessageProps {
  message: ChatMessage;
  isLast?: boolean;
  onOptionSelect?: (option: string) => void;
  onFormSubmit?: (data: Record<number, Record<string, string>>) => void;
  isTyping?: boolean;
  controlDisabled?: boolean;
}

function resolveImageSrc(src: string | Blob | undefined): string {
  if (!src || src instanceof Blob) return '';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  const filename = src.split('/').pop() || src;
  return `/api/images/${encodeURIComponent(filename)}`;
}

export default function AssistantMessage({
  message,
  isLast,
  onOptionSelect,
  onFormSubmit,
  isTyping,
  controlDisabled,
}: AssistantMessageProps) {
  const showControls =
    isLast &&
    !isTyping &&
    !controlDisabled &&
    message.control &&
    !message.control.answered;

  return (
    <div data-testid="assistant-message" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '80%' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        Patch
      </span>
      <div className="bubble-assistant">
        <div className="prose-patch">
          <ReactMarkdown
            components={{
              img: ({ src, alt }) => {
                const resolvedSrc = resolveImageSrc(src);
                return (
                  <img
                    src={resolvedSrc}
                    alt={alt || ''}
                    onError={(e) => {
                      console.error(`Image load failed: ${resolvedSrc}`);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    style={{ borderRadius: 8, maxWidth: '100%', margin: '8px 0', display: 'block' }}
                  />
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      {showControls && message.control && (
        <DynamicControls
          control={message.control}
          onOptionSelect={onOptionSelect}
          onFormSubmit={onFormSubmit}
        />
      )}
    </div>
  );
}

interface HistoryAssistantMessageProps {
  message: ChatMessage;
  isUnanswered?: boolean;
  onOptionSelect?: (option: string) => void;
}

export function HistoryAssistantMessage({ message, isUnanswered, onOptionSelect }: HistoryAssistantMessageProps) {
  return (
    <div data-testid="history-assistant-message" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '80%' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        Patch
      </span>
      <div className="bubble-assistant">
        <div className="prose-patch">
          <ReactMarkdown
            components={{
              img: ({ src, alt }) => {
                const resolvedSrc = resolveImageSrc(src);
                return (
                  <img
                    src={resolvedSrc}
                    alt={alt || ''}
                    style={{ borderRadius: 8, maxWidth: '100%', margin: '8px 0', display: 'block' }}
                  />
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      {message.control && message.control.options && (
        <div data-testid="history-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginLeft: 0 }}>
          {message.control.options.map((option, i) => (
            <button
              key={i}
              data-testid={`history-option-btn-${i}`}
              className="btn-option"
              onClick={() => isUnanswered && onOptionSelect && onOptionSelect(option)}
              disabled={!isUnanswered}
              style={{ opacity: isUnanswered ? 1 : 0.5, cursor: isUnanswered ? 'pointer' : 'default' }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
