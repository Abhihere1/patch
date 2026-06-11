'use client';

import { useState } from 'react';
import { Feedback } from '@/types';

interface FeedbackCardProps {
  incidentId: string;
  existingFeedback?: Feedback;
  embedded?: boolean;
}

export default function FeedbackCard({ incidentId, existingFeedback, embedded }: FeedbackCardProps) {
  const [rating, setRating] = useState<number>(existingFeedback?.rating || 0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState(existingFeedback?.comment || '');
  const [submitted, setSubmitted] = useState(!!existingFeedback?.submittedAt);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/incidents/${incidentId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit feedback.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  }

  const containerStyle = embedded
    ? { borderTop: '1px solid #E5E7EB', paddingTop: 20, marginTop: 20 }
    : {
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 14,
        padding: 24,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      };

  return (
    <div data-testid="feedback-card" style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Rate Your Experience</span>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>Optional</span>
      </div>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
        How was your experience with Patch today?
      </p>

      {submitted ? (
        <div data-testid="feedback-submitted" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} style={{ fontSize: 24, color: star <= rating ? '#F59E0B' : '#D1D5DB' }}>★</span>
            ))}
          </div>
          {comment && <p style={{ fontSize: 13, color: '#374151', fontStyle: 'italic' }}>&ldquo;{comment}&rdquo;</p>}
          <p style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>Thank you for your feedback!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div data-testid="star-rating-row" style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                data-testid={`star-btn-${star}`}
                className={`star-btn ${star <= (hover || rating) ? 'active' : ''}`}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            data-testid="feedback-comment"
            className="input-base"
            style={{ minHeight: 80, resize: 'vertical', width: '100%' }}
            placeholder="Add an optional comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          {error && <p style={{ fontSize: 12, color: '#DC2626' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              data-testid="feedback-submit-btn"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
