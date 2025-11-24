'use client';

import React from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { MessageSquare } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import type { ToolUIPart } from 'ai';

// Re-using types from original page.tsx
type SumToolInput = { a: number; b: number };
type SumToolOutput = { result: number };
type AddPlayerInput = { name: string; initialMoney?: number };
type AddPlayerOutput = { success: boolean; message: string; player?: { name: string; money: number; properties: [] } };
type UpdatePlayerMoneyInput = { playerName: string; amount: number };
type UpdatePlayerMoneyOutput = { success: boolean; message: string; player?: { name: string; money: number } };
type AddPropertyInput = { playerName: string; propertyName: string; colorGroup: string; houses?: number; hotels?: number };
type AddPropertyOutput = { success: boolean; message: string; property?: { name: string; colorGroup: string; houses: number; hotels: number } };
type RemovePropertyInput = { playerName: string; propertyName: string };
type RemovePropertyOutput = { success: boolean; message: string; property?: { name: string; colorGroup: string; houses: number; hotels: number } };
type GetMemoryBankOutput = { success: boolean; message?: string; memoryBank?: unknown; summary?: string };

type MonopolyToolUIPart = ToolUIPart<{
  sum: { input: SumToolInput; output: SumToolOutput };
  addPlayer: { input: AddPlayerInput; output: AddPlayerOutput };
  updatePlayerMoney: { input: UpdatePlayerMoneyInput; output: UpdatePlayerMoneyOutput };
  addProperty: { input: AddPropertyInput; output: AddPropertyOutput };
  removeProperty: { input: RemovePropertyInput; output: RemovePropertyOutput };
  getMemoryBank: { input: Record<string, never>; output: GetMemoryBankOutput };
}>;

export function DealInterface() {
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text, files: message.files });
    }
  };

  const renderToolPart = (
    part: MonopolyToolUIPart,
    messageId: string,
    index: number
  ) => {
    const toolPart = part;

    if (part.type.startsWith('tool-')) {
      return (
        <Tool key={`${messageId}-${index}`} defaultOpen={true}>
          <ToolHeader type={toolPart.type} state={toolPart.state} />
          <ToolContent>
            <ToolInput input={toolPart.input} />
            <ToolOutput
              output={toolPart.output}
              errorText={toolPart.errorText}
            />
          </ToolContent>
        </Tool>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-hidden">
            <Conversation>
            <ConversationContent>
                {messages.length === 0 ? (
                <ConversationEmptyState
                    icon={<MessageSquare className="size-12" />}
                    title="Suggest a Deal"
                    description="Propose a trade or ask AlphaMo about the game state."
                />
                ) : (
                messages.map((message) => (
                    <Message from={message.role} key={message.id}>
                    <MessageContent>
                        {message.parts.map((part, i) => {
                        switch (part.type) {
                            case 'text':
                            return (
                                <MessageResponse key={`${message.id}-${i}`}>
                                {part.text}
                                </MessageResponse>
                            );
                            default:
                            if (part.type.startsWith('tool-')) {
                                return renderToolPart(
                                  part as MonopolyToolUIPart,
                                  message.id,
                                  i
                                );
                            }
                            return null;
                        }
                        })}
                    </MessageContent>
                    </Message>
                ))
                )}
            </ConversationContent>
            <ConversationScrollButton />
            </Conversation>
        </div>
        <div className="p-4 border-t border-gray-200 bg-white">
            <PromptInput
            onSubmit={handleSubmit}
            className="w-full relative"
            >
            <PromptInputTextarea
                placeholder="Offer Park Place for $500..."
                className="pr-12 min-h-[60px] border border-gray-300 focus:border-gray-400"
            />
            <PromptInputSubmit
                status={status === 'streaming' ? 'streaming' : 'ready'}
                className="absolute bottom-3 right-3"
            />
            </PromptInput>
        </div>
    </div>
  );
}
