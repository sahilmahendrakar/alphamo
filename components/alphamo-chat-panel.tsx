'use client';

import { Message as AIMessage } from 'ai';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';

interface AlphamoChatPanelProps {
  messages: AIMessage[];
  isLoading?: boolean;
}

export function AlphamoChatPanel({ messages, isLoading }: AlphamoChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h2 className="font-semibold text-lg text-gray-900">Alphamo Assistant</h2>
        <p className="text-xs text-gray-500 mt-1">AI-powered Monopoly insights</p>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center px-4">
              <div className="space-y-2">
                <div className="text-gray-400 text-sm">No messages yet</div>
                <p className="text-gray-500 text-xs">
                  Start a session and use Play Turn to send transcripts
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  <MessageResponse>{message.content}</MessageResponse>
                </MessageContent>
              </Message>
            ))
          )}
          {isLoading && (
            <Message from="assistant">
              <MessageContent>
                <div className="text-gray-400 text-sm">Thinking...</div>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}

