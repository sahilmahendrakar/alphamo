export interface Property {
  name: string;
  colorGroup: string;
  houses: number;
  hotels: number;
  isMortgaged: boolean;
}

export const AVAILABLE_TOKENS = [
  'Dog',
  'Top Hat',
  'Thimble',
  'Boot',
  'Battleship',
  'Iron',
  'Race Car',
  'Wheelbarrow',
  'Cat',
  'Penguin',
  'Rubber Ducky',
  'T-Rex',
  'Bag of Gold',
  'Cannon',
] as const;

export type Token = typeof AVAILABLE_TOKENS[number];

export const TOKEN_EMOJI_MAP: Record<Token, string> = {
  'Dog': '🐕',
  'Top Hat': '🎩',
  'Thimble': '🧵',
  'Boot': '👢',
  'Battleship': '🚢',
  'Iron': '⚫',
  'Race Car': '🏎️',
  'Wheelbarrow': '🛞',
  'Cat': '🐈',
  'Penguin': '🐧',
  'Rubber Ducky': '🦆',
  'T-Rex': '🦖',
  'Bag of Gold': '💰',
  'Cannon': '💣',
};

export interface Player {
  name: string;
  properties: Property[];
  money: number;
  token?: Token | null;
  inJail: boolean;
  position: number;
}

export type SpaceType = 
  | 'go'
  | 'property'
  | 'railroad'
  | 'utility'
  | 'chance'
  | 'community_chest'
  | 'tax'
  | 'jail'
  | 'free_parking'
  | 'go_to_jail';

export interface BoardSpace {
  position: number;
  name: string;
  type: SpaceType;
  propertyName?: string;
  taxAmount?: number;
}

export interface MemoryBank {
  players: Player[];
}

