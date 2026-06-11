'use client';

import { useState } from 'react';
import { MessageControl } from '@/types';

interface DynamicControlsProps {
  control: MessageControl;
  onOptionSelect?: (option: string) => void;
  onFormSubmit?: (data: Record<number, Record<string, string>>) => void;
}

export default function DynamicControls({ control, onOptionSelect, onFormSubmit }: DynamicControlsProps) {
  if (control.type === 'buttons' || control.type === 'select') {
    return (
      <OptionsControl
        control={control}
        onOptionSelect={onOptionSelect}
      />
    );
  }

  if (control.type === 'form' && control.formFields && control.totalCards) {
    return (
      <FormControl
        control={control}
        onFormSubmit={onFormSubmit}
      />
    );
  }

  return null;
}

function OptionsControl({
  control,
  onOptionSelect,
}: {
  control: MessageControl;
  onOptionSelect?: (option: string) => void;
}) {
  const options = control.options || [];

  if (control.type === 'select') {
    return (
      <div data-testid="select-list-control" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 0 }}>
        {options.map((opt, i) => (
          <button
            key={i}
            data-testid={`select-option-${i}`}
            className="btn-option"
            style={{ textAlign: 'left', width: '100%', maxWidth: 320 }}
            onClick={() => onOptionSelect && onOptionSelect(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="options-control" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 0 }}>
      {options.map((opt, i) => (
        <button
          key={i}
          data-testid={`option-btn-${i}`}
          className="btn-option"
          onClick={() => onOptionSelect && onOptionSelect(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function FormControl({
  control,
  onFormSubmit,
}: {
  control: MessageControl;
  onFormSubmit?: (data: Record<number, Record<string, string>>) => void;
}) {
  const totalCards = control.totalCards || 1;
  const fields = control.formFields || [];
  const [cardData, setCardData] = useState<Record<number, Record<string, string>>>(
    control.partialFormState || {}
  );
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [satisfied, setSatisfied] = useState<Record<number, boolean>>({});

  function updateField(cardIndex: number, fieldName: string, value: string) {
    setCardData(prev => ({
      ...prev,
      [cardIndex]: { ...(prev[cardIndex] || {}), [fieldName]: value },
    }));

    // Check if card is satisfied
    const cardValues = { ...(cardData[cardIndex] || {}), [fieldName]: value };
    const allFilled = fields.filter(f => f.mandatory).every(f => cardValues[f.name]?.trim());
    setSatisfied(prev => ({ ...prev, [cardIndex]: allFilled }));
  }

  function validate(): boolean {
    const newErrors: Record<number, Record<string, string>> = {};
    let valid = true;

    for (let i = 0; i < totalCards; i++) {
      const cardErrors: Record<string, string> = {};
      for (const field of fields) {
        if (field.mandatory && !cardData[i]?.[field.name]?.trim()) {
          cardErrors[field.name] = `${field.label} is required.`;
          valid = false;
        }
      }
      if (Object.keys(cardErrors).length > 0) newErrors[i] = cardErrors;
    }

    setErrors(newErrors);
    return valid;
  }

  function handleSubmit() {
    if (validate() && onFormSubmit) {
      onFormSubmit(cardData);
    }
  }

  return (
    <div data-testid="form-control" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 560 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Device Information
      </div>
      {Array.from({ length: totalCards }, (_, i) => (
        <div
          key={i}
          data-testid={`device-card-${i}`}
          style={{
            background: '#FFFFFF',
            border: `1px solid ${satisfied[i] ? '#10B981' : '#E5E7EB'}`,
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#111827' }}>
            Device {i + 1}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fields.map(field => (
              <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                  htmlFor={`field-${i}-${field.name}`}
                  style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}
                >
                  {field.label}
                  {field.mandatory && <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>}
                </label>
                <input
                  id={`field-${i}-${field.name}`}
                  data-testid={`form-field-${i}-${field.name}`}
                  type={field.type || 'text'}
                  className="input-base"
                  value={cardData[i]?.[field.name] || ''}
                  onChange={e => updateField(i, field.name, e.target.value)}
                  placeholder={field.label}
                />
                {errors[i]?.[field.name] && (
                  <span data-testid={`field-error-${i}-${field.name}`} style={{ fontSize: 11, color: '#DC2626' }}>
                    {errors[i][field.name]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          data-testid="form-submit-btn"
          className="btn-primary"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
