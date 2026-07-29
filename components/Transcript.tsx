'use client';

import { useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Messages } from '@/types';

interface TranscriptProps {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
  onStartVoice?: () => void;
  isActive?: boolean;
  isLoading?: boolean;
}

const Transcript = ({
  messages,
  currentMessage,
  currentUserMessage,
  onStartVoice,
  isActive,
  isLoading,
}: TranscriptProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentMessage, currentUserMessage]);

  const isEmpty = messages.length === 0 && !currentMessage && !currentUserMessage;

  if (isEmpty) {
    return (
      <div className="transcript-empty flex flex-col items-center justify-center p-6 space-y-8 flex-1 h-full">
        <button
          onClick={onStartVoice}
          disabled={isLoading}
          className="group flex flex-col items-center gap-3 transition-all cursor-pointer select-none"
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-md ${
              isActive ? 'bg-rose-700 text-white' : 'bg-[#663820] text-white'
            }`}
          >
            {isLoading ? (
              <Loader2 className="size-8 animate-spin" />
            ) : isActive ? (
              <MicOff className="size-8" />
            ) : (
              <Mic className="size-8 animate-pulse" />
            )}
          </div>

          <span className="font-bold text-base font-serif text-[#663820] group-hover:text-[#7a4528] transition-colors">
            {isLoading ? 'Connecting Voice...' : isActive ? 'End Voice Session' : 'Start Voice Session'}
          </span>
        </button>

        <div className="text-center space-y-1.5 max-w-sm mt-2">
          <h2 className="transcript-empty-text font-serif">Start talking to your AI companion</h2>
          <p className="transcript-empty-hint">
            Click the button above to ask anything about the book or start a voice conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
      <div ref={scrollRef} className="transcript-messages overflow-y-auto pr-2 flex-1 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`transcript-message ${
              message.role === 'user' ? 'transcript-message-user' : 'transcript-message-assistant'
            }`}
          >
            <div
              className={`transcript-bubble ${
                message.role === 'user' ? 'transcript-bubble-user' : 'transcript-bubble-assistant'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* User Streaming Message */}
        {currentUserMessage && (
          <div className="transcript-message transcript-message-user">
            <div className="transcript-bubble transcript-bubble-user">
              {currentUserMessage}
            </div>
          </div>
        )}

        {/* Assistant Streaming Message */}
        {currentMessage && (
          <div className="transcript-message transcript-message-assistant">
            <div className="transcript-bubble transcript-bubble-assistant">
              {currentMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transcript;
