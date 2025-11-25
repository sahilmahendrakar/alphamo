'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { GameStateDisplay } from '@/components/game-state-display';
import { TurnSidebar, CapturedItem } from '@/components/turn-sidebar';
import { AlphamoChatPanel } from '@/components/alphamo-chat-panel';
import { MemoryBank } from '@/lib/memory/types';
import { FileUIPart } from 'ai';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';

export default function Home() {
  const [gameState, setGameState] = useState<MemoryBank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { messages, sendMessage, status } = useChat();

  const fetchMemoryState = async () => {
    try {
      const response = await fetch('/api/memory');
      if (!response.ok) {
        throw new Error('Failed to fetch memory state');
      }
      const data = await response.json();
      setGameState(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching memory state:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemoryState();

    const pollInterval = setInterval(() => {
      fetchMemoryState();
    }, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleCapture = async (item: CapturedItem) => {
    const files: FileUIPart[] = [];
    
    if (item.image) {
      const mimeMatch = item.image.match(/^data:(.*?);/);
      const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      const file: FileUIPart = {
        type: 'file',
        url: item.image,
        mediaType,
        filename: `board-${item.timestamp}.jpg`,
      };
      
      files.push(file);
    }
    
    let turnContext: string;
    
    if (item.transcript) {
      try {
        const summarizeResponse = await fetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript: item.transcript }),
        });
        
        if (summarizeResponse.ok) {
          const { summary } = await summarizeResponse.json();
          turnContext = `It's your turn now. Here's what happened: ${summary}`;
        } else {
          console.warn('Summarization failed, using original transcript');
          turnContext = `It's your turn now. Here's what happened: ${item.transcript}`;
        }
      } catch (error) {
        console.error('Error calling summarize API:', error);
        turnContext = `It's your turn now. Here's what happened: ${item.transcript}`;
      }
    } else {
      turnContext = 'It\'s your turn now. Here\'s the current board state.';
    }
    
    sendMessage({
      text: turnContext,
      files,
    });
  };

  const handleSendMessage = (message: PromptInputMessage) => {
    sendMessage({
      text: message.text,
      files: message.files,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">

      {/* 1. Header Row - Full Width */}
      <div className="h-20 shrink-0 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm z-20">
        <div className="flex items-center gap-4">
             <div className="bg-red-600 border-2 border-red-600 rounded shadow-sm">
               <div className="bg-white border border-white rounded-[1px]">
                 <div className="bg-red-600 px-4 py-1">
                   <h1 className="text-2xl font-bold text-white tracking-wide">
                     AlphaMo
                   </h1>
                 </div>
               </div>
             </div>
             <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Monopoly Assistant</span>
        </div>
      </div>

      {/* 2. Main Content Area - Split into 3 columns */}
      <div className="flex-1 flex overflow-hidden">

          {/* Left: Game State (Flexible width) */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#F3F4F6]">
             {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-lg">Loading game state...</div>
                </div>
             ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-500 text-lg">Error: {error}</div>
                </div>
             ) : gameState ? (
                <GameStateDisplay gameState={gameState} />
             ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-lg">No game data available</div>
                </div>
             )}
          </div>

          {/* Middle: Alphamo Chat Panel (Fixed width) */}
          <div className="w-[350px] shrink-0 border-l border-gray-200 bg-white z-10">
             <AlphamoChatPanel 
               messages={messages} 
               isLoading={status === 'submitted' || status === 'streaming'} 
               onSendMessage={handleSendMessage}
               status={status}
             />
          </div>

          {/* Right: Turn Sidebar (Fixed width) */}
          <div className="w-[350px] shrink-0 border-l border-gray-200 bg-white z-10">
             <TurnSidebar onCapture={handleCapture} />
          </div>
      </div>
    </div>
  );
}
