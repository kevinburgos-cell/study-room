import React from 'react';
import { Message } from '../hooks/useChat';

interface ChatMessageProps {
  message: Message;
  isMe: boolean;
}

export default function ChatMessage({ message, isMe }: ChatMessageProps) {
  const { senderUsername, senderPhotoURL, text, timestamp } = message;

  // Extract initial from username for fallback avatar
  const getInitial = () => {
    return senderUsername ? senderUsername.charAt(0).toUpperCase() : '?';
  };

  // Format timestamp (e.g., "3:45 PM")
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMe ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginBottom: '1rem',
        width: '100%',
      }}
    >
      {/* Avatar circular (32px) */}
      {senderPhotoURL ? (
        <img
          src={senderPhotoURL}
          alt={senderUsername}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
            marginTop: '2px',
          }}
        />
      ) : (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isMe ? '#2563eb' : '#475569',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem',
            marginTop: '2px',
          }}
        >
          {getInitial()}
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMe ? 'flex-end' : 'flex-start',
          maxWidth: '70%',
        }}
      >
        {/* Username */}
        {!isMe && (
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              marginBottom: '0.15rem',
              marginLeft: '0.25rem',
            }}
          >
            {senderUsername}
          </span>
        )}

        {/* Message bubble */}
        <div
          style={{
            padding: '0.6rem 0.85rem',
            fontSize: '0.9rem',
            lineHeight: '1.4',
            wordBreak: 'break-word',
            color: '#ffffff',
            backgroundColor: isMe ? '#2563eb' : '#334155', // bg-blue-600 and bg-[#334155]
            borderRadius: isMe ? '12px 0px 12px 12px' : '0px 12px 12px 12px',
            border: isMe ? 'none' : '1px solid #475569',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          }}
        >
          {text}
        </div>

        {/* Time under bubble */}
        {formatTime(timestamp) && (
          <span
            style={{
              fontSize: '0.7rem',
              color: '#94a3b8', // text-gray-400
              marginTop: '0.25rem',
              padding: '0 0.25rem',
            }}
          >
            {formatTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
