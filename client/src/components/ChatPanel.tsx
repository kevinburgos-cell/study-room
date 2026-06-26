import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useAuth } from '../contexts/AuthContext';

interface ChatPanelProps {
  roomId: string;
  open: boolean;
  onClose: () => void;
  mobile?: boolean;
  className?: string;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export default function ChatPanel({ roomId, open, onClose, mobile = false, className = '' }: ChatPanelProps) {
  const { user } = useAuth();
  const { messages, isLoading, error, sendError, sendMessage, retryLoadHistory } = useChat(roomId);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const parseMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setNewMessagesCount(0);
    setIsNearBottom(true);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 100;
    setIsNearBottom(isAtBottom);
    if (isAtBottom) setNewMessagesCount(0);
  };

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      requestAnimationFrame(() => scrollToBottom());
    }
  }, [isLoading, messages.length]);

  const prevMessagesCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      if (isNearBottom || open) {
        scrollToBottom();
      } else {
        setNewMessagesCount((prev) => prev + (messages.length - prevMessagesCount.current));
      }
    }
    prevMessagesCount.current = messages.length;
  }, [messages, isNearBottom, open]);

  useEffect(() => {
    if (open) setNewMessagesCount(0);
  }, [open]);

  const getGroupedDateLabel = (dateStr: string) => {
    const date = parseMessageDate(dateStr);
    if (!date) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  const panelClasses = mobile
    ? 'h-full w-full'
    : 'h-full w-[320px] border-l border-slate-700';

  return (
    <div
      className={[
        'flex flex-col bg-slate-800 text-white',
        panelClasses,
        mobile ? 'rounded-t-2xl' : '',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <h2 className="text-base font-semibold">Chat</h2>
        <button onClick={onClose} className="rounded-full p-2 text-slate-300 hover:bg-slate-700 hover:text-white">
          <CloseIcon />
        </button>
      </div>

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-start gap-3 rounded-xl bg-slate-700/40 p-3">
                <div className="h-8 w-8 rounded-full bg-slate-600" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-slate-600" />
                  <div className="h-9 rounded bg-slate-600/80" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-red-300">
            <p className="text-sm">{error}</p>
            <button onClick={retryLoadHistory} className="text-sm font-semibold text-blue-300 underline">
              Reintentar
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-300">
            <p className="text-sm">Aún no hay mensajes</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMe = message.senderUid === user?.uid;
            const currentLabel = getGroupedDateLabel(message.timestamp);
            const previousLabel = index > 0 ? getGroupedDateLabel(messages[index - 1].timestamp) : '';
            const showDateSeparator = index === 0 || previousLabel !== currentLabel;

            return (
              <React.Fragment key={message.id}>
                {showDateSeparator && currentLabel && (
                  <div className="my-3 flex items-center justify-center">
                    <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-200">{currentLabel}</span>
                  </div>
                )}
                <ChatMessage message={message} isMe={isMe} />
              </React.Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {!isNearBottom && newMessagesCount > 0 && !open && (
        <button
          onClick={scrollToBottom}
          className="mx-auto mb-3 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg"
        >
          {newMessagesCount} {newMessagesCount === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
        </button>
      )}

      <div className="border-t border-slate-700 p-3">
        <ChatInput onSendMessage={sendMessage} onSent={() => requestAnimationFrame(() => scrollToBottom())} isLoading={isLoading} error={sendError} />
      </div>
    </div>
  );
}
