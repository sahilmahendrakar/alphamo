'use client';

import { UIMessage, type ToolUIPart } from 'ai';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  ToolCompact,
} from '@/components/ai-elements/tool';

type SumToolInput = {
  a: number;
  b: number;
};

type SumToolOutput = {
  result: number;
};

type AddPlayerInput = {
  name: string;
  initialMoney?: number;
};

type AddPlayerOutput = {
  success: boolean;
  message: string;
  player?: { name: string; money: number; properties: [] };
};

type UpdatePlayerMoneyInput = {
  playerName: string;
  amount: number;
};

type UpdatePlayerMoneyOutput = {
  success: boolean;
  message: string;
  player?: { name: string; money: number };
};

type AddPropertyInput = {
  playerName: string;
  propertyName: string;
  colorGroup: string;
  houses?: number;
  hotels?: number;
};

type AddPropertyOutput = {
  success: boolean;
  message: string;
  property?: { name: string; colorGroup: string; houses: number; hotels: number };
};

type RemovePropertyInput = {
  playerName: string;
  propertyName: string;
};

type RemovePropertyOutput = {
  success: boolean;
  message: string;
  property?: { name: string; colorGroup: string; houses: number; hotels: number };
};

type UpdatePropertyInput = {
  playerName: string;
  propertyName: string;
  houses?: number;
  hotels?: number;
};

type UpdatePropertyOutput = {
  success: boolean;
  message: string;
  property?: { name: string; colorGroup: string; houses: number; hotels: number };
};

type GetMemoryBankOutput = {
  success: boolean;
  message?: string;
  memoryBank?: any;
  summary?: string;
};

type MonopolyToolUIPart = ToolUIPart<{
  sum: {
    input: SumToolInput;
    output: SumToolOutput;
  };
  addPlayer: {
    input: AddPlayerInput;
    output: AddPlayerOutput;
  };
  updatePlayerMoney: {
    input: UpdatePlayerMoneyInput;
    output: UpdatePlayerMoneyOutput;
  };
  addProperty: {
    input: AddPropertyInput;
    output: AddPropertyOutput;
  };
  removeProperty: {
    input: RemovePropertyInput;
    output: RemovePropertyOutput;
  };
  updateProperty: {
    input: UpdatePropertyInput;
    output: UpdatePropertyOutput;
  };
  getMemoryBank: {
    input: Record<string, never>;
    output: GetMemoryBankOutput;
  };
}>;

const getToolActionText = (toolType: string, input: any): string => {
  const toolName = toolType.replace('tool-call-', '').replace('tool-result-', '');
  
  switch (toolName) {
    case 'addPlayer':
      return `Adding player ${input?.name || ''}...`;
    case 'updatePlayerMoney':
      return `Updating ${input?.playerName || 'player'}'s money...`;
    case 'addProperty':
      return `Adding ${input?.propertyName || 'property'} to ${input?.playerName || 'player'}...`;
    case 'removeProperty':
      return `Removing ${input?.propertyName || 'property'} from ${input?.playerName || 'player'}...`;
    case 'updateProperty':
      return `Updating ${input?.propertyName || 'property'}...`;
    case 'getMemoryBank':
      return 'Getting memory bank...';
    default:
      return `Calling ${toolName}...`;
  }
};

interface AlphamoChatPanelProps {
  messages: UIMessage[];
  isLoading?: boolean;
}

export function AlphamoChatPanel({ messages, isLoading }: AlphamoChatPanelProps) {
  const renderToolPart = (part: any, messageId: string, index: number) => {
    const toolPart = part as MonopolyToolUIPart;
    
    if (part.type.startsWith('tool-')) {
      const actionText = getToolActionText(toolPart.type, toolPart.input);
      return (
        <ToolCompact
          key={`${messageId}-${index}`}
          tool={toolPart}
          actionText={actionText}
        />
      );
    }
    return null;
  };

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
                  {message.parts.map((part: any, i: number) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      default:
                        if (part.type.startsWith('tool-')) {
                          return renderToolPart(part, message.id, i);
                        }
                        return null;
                    }
                  })}
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

