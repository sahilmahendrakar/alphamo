import { BoardSpace } from '@/lib/memory/types';

export const MONOPOLY_BOARD: BoardSpace[] = [
  { position: 0, name: 'Go', type: 'go' },
  { position: 1, name: 'Mediterranean Avenue', type: 'property', propertyName: 'Mediterranean Avenue' },
  { position: 2, name: 'Community Chest', type: 'community_chest' },
  { position: 3, name: 'Baltic Avenue', type: 'property', propertyName: 'Baltic Avenue' },
  { position: 4, name: 'Income Tax', type: 'tax', taxAmount: 200 },
  { position: 5, name: 'Reading Railroad', type: 'railroad', propertyName: 'Reading Railroad' },
  { position: 6, name: 'Oriental Avenue', type: 'property', propertyName: 'Oriental Avenue' },
  { position: 7, name: 'Chance', type: 'chance' },
  { position: 8, name: 'Vermont Avenue', type: 'property', propertyName: 'Vermont Avenue' },
  { position: 9, name: 'Connecticut Avenue', type: 'property', propertyName: 'Connecticut Avenue' },
  { position: 10, name: 'Jail (Just Visiting)', type: 'jail' },
  { position: 11, name: 'St. Charles Place', type: 'property', propertyName: 'St. Charles Place' },
  { position: 12, name: 'Electric Company', type: 'utility', propertyName: 'Electric Company' },
  { position: 13, name: 'States Avenue', type: 'property', propertyName: 'States Avenue' },
  { position: 14, name: 'Virginia Avenue', type: 'property', propertyName: 'Virginia Avenue' },
  { position: 15, name: 'Pennsylvania Railroad', type: 'railroad', propertyName: 'Pennsylvania Railroad' },
  { position: 16, name: 'St. James Place', type: 'property', propertyName: 'St. James Place' },
  { position: 17, name: 'Community Chest', type: 'community_chest' },
  { position: 18, name: 'Tennessee Avenue', type: 'property', propertyName: 'Tennessee Avenue' },
  { position: 19, name: 'New York Avenue', type: 'property', propertyName: 'New York Avenue' },
  { position: 20, name: 'Free Parking', type: 'free_parking' },
  { position: 21, name: 'Kentucky Avenue', type: 'property', propertyName: 'Kentucky Avenue' },
  { position: 22, name: 'Chance', type: 'chance' },
  { position: 23, name: 'Indiana Avenue', type: 'property', propertyName: 'Indiana Avenue' },
  { position: 24, name: 'Illinois Avenue', type: 'property', propertyName: 'Illinois Avenue' },
  { position: 25, name: 'B&O Railroad', type: 'railroad', propertyName: 'B&O Railroad' },
  { position: 26, name: 'Atlantic Avenue', type: 'property', propertyName: 'Atlantic Avenue' },
  { position: 27, name: 'Ventnor Avenue', type: 'property', propertyName: 'Ventnor Avenue' },
  { position: 28, name: 'Water Works', type: 'utility', propertyName: 'Water Works' },
  { position: 29, name: 'Marvin Gardens', type: 'property', propertyName: 'Marvin Gardens' },
  { position: 30, name: 'Go To Jail', type: 'go_to_jail' },
  { position: 31, name: 'Pacific Avenue', type: 'property', propertyName: 'Pacific Avenue' },
  { position: 32, name: 'North Carolina Avenue', type: 'property', propertyName: 'North Carolina Avenue' },
  { position: 33, name: 'Community Chest', type: 'community_chest' },
  { position: 34, name: 'Pennsylvania Avenue', type: 'property', propertyName: 'Pennsylvania Avenue' },
  { position: 35, name: 'Short Line Railroad', type: 'railroad', propertyName: 'Short Line Railroad' },
  { position: 36, name: 'Chance', type: 'chance' },
  { position: 37, name: 'Park Place', type: 'property', propertyName: 'Park Place' },
  { position: 38, name: 'Luxury Tax', type: 'tax', taxAmount: 100 },
  { position: 39, name: 'Boardwalk', type: 'property', propertyName: 'Boardwalk' },
];

export function getBoardSpaceByPosition(position: number): BoardSpace | undefined {
  return MONOPOLY_BOARD.find(space => space.position === position);
}

export function getBoardSpaceByName(name: string): BoardSpace | undefined {
  return MONOPOLY_BOARD.find(space => space.name === name || space.propertyName === name);
}

