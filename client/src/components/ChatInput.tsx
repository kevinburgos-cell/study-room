import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onSent?: () => void;
  isLoading: boolean;
  error?: string | null;
}

export default function ChatInput({ onSendMessage, onSent, isLoading, error }: ChatInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading || sending) return;

    if (text.length > 500) return;

    setSending(true);
    setLocalError('');
    try {
      await onSendMessage(text);
      setText('');
      onSent?.();
    } catch (err) {
      console.error(err);
      setLocalError('No se pudo enviar. Intenta de nuevo');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = !text.trim() || isLoading || sending;

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div style={{ flexGrow: 1, position: 'relative' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
            placeholder="Escribe un mensaje..."
            disabled={isLoading || sending}
            aria-label="Escribe un mensaje"
            rows={1}
            style={{
              width: '100%',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '0.65rem 0.75rem',
              fontSize: '0.9rem',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              minHeight: '38px',
              fontFamily: 'inherit',
              lineHeight: '1.4',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          style={{
            height: '38px',
            width: '38px',
            borderRadius: '8px',
            backgroundColor: isDisabled ? '#1e293b' : '#2563eb',
            border: 'none',
            color: isDisabled ? '#64748b' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
          aria-label="Enviar mensaje"
        >
          {sending ? (
            <span
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 1s linear infinite',
              }}
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ width: '18px', height: '18px', transform: 'rotate(0deg)' }}
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.53 60.53 0 0 0 18.028-9.215.75.75 0 0 0 0-1.186 60.53 60.53 0 0 0-18.028-9.215Z" />
            </svg>
          )}
        </button>
      </div>

      {/* Character Counter (starts showing at 400 characters) */}
      {text.length >= 400 && (
        <span
          style={{
            alignSelf: 'flex-end',
            fontSize: '0.7rem',
            color: text.length === 500 ? 'var(--color-danger)' : 'var(--text-secondary)',
            marginRight: '3rem',
          }}
        >
          {text.length} / 500
        </span>
      )}
      {(error || localError) && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>
          {error || localError}
        </span>
      )}
    </form>
  );
}
