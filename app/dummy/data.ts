import { MemoryBank } from '@/lib/memory/types';

export const initialGameState: MemoryBank = {
  players: [
    {
      name: 'AlphaMo',
      money: 1500,
      properties: [
        { name: 'Park Place', colorGroup: 'Blue', houses: 0, hotels: 0 },
        { name: 'Boardwalk', colorGroup: 'Blue', houses: 0, hotels: 0 },
      ],
    },
    {
      name: 'Sahil',
      money: 1200,
      properties: [
        { name: 'Reading Railroad', colorGroup: 'Railroad', houses: 0, hotels: 0 },
        { name: 'Oriental Avenue', colorGroup: 'Light Blue', houses: 3, hotels: 0 },
      ],
    },
    {
      name: 'Ben',
      money: 800,
      properties: [
        { name: 'St. Charles Place', colorGroup: 'Pink', houses: 0, hotels: 1 },
        { name: 'Electric Company', colorGroup: 'Utility', houses: 0, hotels: 0 },
      ],
    },
    {
      name: 'Vish',
      money: 950,
      properties: [
        { name: 'Pennsylvania Avenue', colorGroup: 'Green', houses: 2, hotels: 0 },
        { name: 'Baltic Avenue', colorGroup: 'Brown', houses: 0, hotels: 0 },
        { name: 'B&O Railroad', colorGroup: 'Railroad', houses: 0, hotels: 0 },
      ],
    },
  ],
};

export const dummyTranscript = "I'll trade you Reading Railroad for Park Place.";
export const dummyImage = "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bW9ub3BvbHklMjBib2FyZHxlbnwwfHwwfHx8MA%3D%3D";

