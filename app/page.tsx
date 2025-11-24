'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { GameStateDisplay } from '@/components/game-state-display';
import { DealInterface } from '@/components/deal-interface';
import { TurnSidebar, CapturedItem } from '@/components/turn-sidebar';
import { AlphamoChatPanel } from '@/components/alphamo-chat-panel';
import { MemoryBank } from '@/lib/memory/types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FileUIPart } from 'ai';

export default function Home() {
  const [isDealInterfaceOpen, setIsDealInterfaceOpen] = useState(false);
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

  const handleCapture = (item: CapturedItem) => {
    const mimeMatch = item.image.match(/^data:(.*?);/);
    const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    const file: FileUIPart = {
      type: 'file',
      url: item.image,
      mediaType,
      filename: `board-${item.timestamp}.jpg`,
    };
    
    sendMessage({
      text: item.transcript || 'Captured board state',
      files: [file],
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
                <GameStateDisplay
                  gameState={gameState}
                  onOfferDeal={() => setIsDealInterfaceOpen(true)}
                />
             ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-lg">No game data available</div>
                </div>
             )}
          </div>

          {/* Middle: Alphamo Chat Panel (Fixed width) */}
          <div className="w-[350px] shrink-0 border-l border-gray-200 bg-white z-10">
             <AlphamoChatPanel messages={messages} isLoading={status === 'submitted' || status === 'streaming'} />
          </div>

          {/* Right: Turn Sidebar (Fixed width) */}
          <div className="w-[350px] shrink-0 border-l border-gray-200 bg-white z-10">
             <TurnSidebar onCapture={handleCapture} />
          </div>
      </div>

      {/* Deal Interface Slide-over */}
      <div
        className={`fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l border-gray-200 flex flex-col ${
            isDealInterfaceOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="font-semibold text-xl text-gray-900">Propose Deal</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsDealInterfaceOpen(false)}>
                <X className="h-5 w-5" />
            </Button>
        </div>
        <div className="flex-1 overflow-hidden">
            <DealInterface />
        </div>
      </div>
    </div>
  );
}
