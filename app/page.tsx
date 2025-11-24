'use client';

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

type SumToolInput = {
  a: number;
  b: number;
};

type SumToolOutput = {
  result: number;
};

type SumToolUIPart = ToolUIPart<{
  sum: {
    input: SumToolInput;
    output: SumToolOutput;
  };
}>;

const formatSumResult = (output?: SumToolOutput): string => {
  if (!output) return 'Calculating...';
  return JSON.stringify({ result: output.result }, null, 2);
};

export default function Home() {
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text, files: message.files });
    }
  };

  const renderToolPart = (part: any, messageId: string, index: number) => {
    if (part.type === 'tool-sum') {
      const toolPart = part as SumToolUIPart;
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
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
                description="Type a message below to begin chatting"
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
                            return renderToolPart(part, message.id, i);
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
        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            placeholder="Say something..."
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            className="absolute bottom-1 right-1"
          />
        </PromptInput>
      </div>
    </div>
  );
}
