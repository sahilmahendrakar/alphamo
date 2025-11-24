'use client';

import { useState } from 'react';
import { GameStateDisplay } from '@/components/game-state-display';
import { DealInterface } from '@/components/deal-interface';
import { TurnSidebar } from '@/components/turn-sidebar';
import { initialGameState } from '@/app/dummy/data';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function Home() {
  const [isDealInterfaceOpen, setIsDealInterfaceOpen] = useState(false);
  const [gameState] = useState(initialGameState);

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

      {/* 2. Main Content Area - Split vertically */}
      <div className="flex-1 flex overflow-hidden">

          {/* Left: Game State (Flexible width) */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#F3F4F6]">
             <GameStateDisplay
                gameState={gameState}
                onOfferDeal={() => setIsDealInterfaceOpen(true)}
            />
          </div>

          {/* Right: Turn Sidebar (Fixed width) */}
          <div className="w-[350px] shrink-0 border-l border-gray-200 bg-white z-10">
             <TurnSidebar />
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
