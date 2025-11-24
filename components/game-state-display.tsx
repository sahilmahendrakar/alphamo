import React from 'react';
import { MemoryBank, Player, Property } from '@/lib/memory/types';
import { Button } from '@/components/ui/button';
import { Handshake } from 'lucide-react';

const colorMap: Record<string, string> = {
  Brown: 'bg-[#8B4513]',
  'Light Blue': 'bg-[#87CEEB]',
  Pink: 'bg-[#FF69B4]',
  Orange: 'bg-[#FFA500]',
  Red: 'bg-[#FF0000]',
  Yellow: 'bg-[#FFD700]',
  Green: 'bg-[#008000]',
  Blue: 'bg-[#0000FF]',
  Railroad: 'bg-black',
  Utility: 'bg-gray-300',
};

interface GameStateDisplayProps {
  gameState: MemoryBank;
  onOfferDeal: () => void;
}

export function GameStateDisplay({ gameState, onOfferDeal }: GameStateDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {gameState.players.map((player) => (
          <PlayerCard
              key={player.name}
              player={player}
              onOfferDeal={onOfferDeal}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ player, onOfferDeal }: { player: Player; onOfferDeal: () => void }) {
  const isAlphaMo = player.name === 'AlphaMo';

  return (
    <div className="flex flex-col bg-white border border-gray-200 h-full">
      <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex items-baseline gap-4">
          <h3 className="font-bold text-2xl text-gray-900 tracking-tight">{player.name}</h3>
          <span className="font-mono font-semibold text-xl text-gray-600">
            ${player.money.toLocaleString()}
          </span>
        </div>

        {isAlphaMo && (
            <Button
                onClick={onOfferDeal}
                className="bg-black hover:bg-gray-800 text-white h-8 text-xs px-3"
                size="sm"
            >
                <Handshake className="w-3.5 h-3.5 mr-2" />
                Deal
            </Button>
        )}
      </div>

      <div className="p-6 bg-gray-50/50 flex-1 min-h-[200px]">
        {player.properties.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium tracking-wide italic">
            No Properties
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-4 content-start">
            {player.properties.map((prop) => (
              <PropertyCard key={prop.name} property={prop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HouseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function HotelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 21h18v-8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zM12 3L3 9h18L12 3z" />
      <rect x="8" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const colorClass = colorMap[property.colorGroup] || 'bg-gray-200';

  return (
    <div className="w-full aspect-[3/4] bg-white border border-gray-300 flex flex-col text-center relative cursor-default rounded-[1px] overflow-hidden group">
        {/* Houses/Hotels Visual Indicator */}
        {(property.houses > 0 || property.hotels > 0) && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
                {property.hotels > 0 ? (
                   <div className="bg-red-600 text-white p-1 rounded shadow-sm border border-red-700">
                      <HotelIcon className="w-3 h-3" />
                   </div>
                ) : (
                  Array.from({ length: property.houses }).map((_, i) => (
                    <div key={i} className="bg-green-600 text-white p-0.5 rounded-sm shadow-sm border border-green-700">
                       <HouseIcon className="w-2.5 h-2.5" />
                    </div>
                  ))
                )}
            </div>
        )}

        {/* Color Header - Consistent Height */}
        <div className={`h-[20%] w-full ${colorClass} border-b border-black/10 shadow-inner`}></div>

        {/* Content - Flex Center */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
            <div className="text-[8px] font-semibold uppercase tracking-widest mb-1.5 text-gray-500">
                Title Deed
            </div>
            <div className="text-[11px] font-bold leading-tight px-1 text-gray-900 line-clamp-3">
                {property.name}
            </div>
        </div>
    </div>
  );
}
