export interface Property {
  name: string;
  colorGroup: string;
  houses: number;
  hotels: number;
  isMortgaged: boolean;
}

export interface Player {
  name: string;
  properties: Property[];
  money: number;
}

export interface MemoryBank {
  players: Player[];
}

