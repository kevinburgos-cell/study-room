import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useAuth } from '../contexts/AuthContext';

interface ChatPanelProps {
  roomId: string;
}

export default function ChatPanel({ roomId }: ChatPanelProps) {
  const { user } = useAuth();
  const { messages, isLoading, error, sendError, sendMessage, retryLoadHistory } = useChat(roomId);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setNewMessagesCount(0);
      setIsNearBottom(true);
    }
  };

  // Scroll event handler to check if user is near bottom
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 100;
    
    setIsNearBottom(isAtBottom);
    if (isAtBottom) {
      setNewMessagesCount(0);
    }
  };

  // Scroll to bottom on initial history load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [isLoading, messages.length]);

  // Handle auto-scroll or badge when new messages arrive
  const prevMessagesCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      if (isNearBottom) {
        scrollToBottom();
      } else {
        // Increment new messages badge
        setNewMessagesCount((prev) => prev + (messages.length - prevMessagesCount.current));
      }
    }
    prevMessagesCount.current = messages.length;
  }, [messages, isNearBottom]);

  // Date separator label helper
  const getGroupedDateLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Hoy';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ayer';
      } else {
        return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      }
    } catch (e) {
      return '';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-color)',
        position: 'relative',
      }}
    >
      {/* Chat Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(30, 41, 59, 0.4)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>Chat de la sala</h2>
      </div>

      {/* Messages Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flexGrow: 1,
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading ? (
          /* Skeleton Loader (3 pulse messages) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="skeleton-pulse"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  maxWidth: '70%',
                  alignSelf: n === 2 ? 'flex-end' : 'flex-start',
                  flexDirection: n === 2 ? 'row-reverse' : 'row',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#334155' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '150px' }}>
                  <div style={{ height: '12px', width: '80px', backgroundColor: '#334155', borderRadius: '4px' }} />
                  <div style={{ height: '36px', width: '100%', backgroundColor: '#334155', borderRadius: '8px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--color-danger)', textAlign: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>{error}</p>
            <button
              onClick={retryLoadHistory}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Reintentar
            </button>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, textAlign: 'center', padding: '2rem 1.5rem', gap: '0.75rem' }}>
            <div style={{ fontSize: '2.5rem', opacity: 0.6 }} role="img" aria-label="Burbuja de chat">💬</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>Aún no hay mensajes</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '200px' }}>
              ¡Sé el primero en escribir algo!
            </p>
          </div>
        ) : (
          /* Messages List with date grouping */
          messages.map((message, index) => {
            const isMe = message.senderUid === user?.uid;
            
            // Determine if a date separator is needed
            const showDateSeparator =
              index === 0 ||
              getGroupedDateLabel(messages[index - 1].timestamp) !== getGroupedDateLabel(message.timestamp);

            return (
              <React.Fragment key={message.id}>
                {showDateSeparator && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '1.25rem 0',
                      position: 'relative',
                    }}
                  >
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: 'var(--border-color)', zIndex: 1 }} />
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        backgroundColor: 'var(--bg-surface)',
                        padding: '0 0.75rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      {getGroupedDateLabel(message.timestamp)}
                    </span>
                  </div>
                )}
                <ChatMessage message={message} isMe={isMe} />
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Floating "New Messages" Badge Indicator */}
      {!isNearBottom && newMessagesCount > 0 && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.4rem 0.85rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            zIndex: 10,
            animation: 'pulse 2s infinite',
          }}
        >
          {newMessagesCount} {newMessagesCount === 1 ? 'mensaje nuevo' : 'mensajes nuevos'} ↓
        </button>
      )}

      {/* Input Area */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(30, 41, 59, 0.2)' }}>
        <ChatInput
          onSendMessage={sendMessage}
          onSent={() => requestAnimationFrame(scrollToBottom)}
          isLoading={isLoading}
          error={sendError}
        />
      </div>
    </div>
  );
}
