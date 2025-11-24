import { tool } from 'ai';
import { z } from 'zod';
import { withTransaction, getPlayer, getAvailablePlayerNames } from '@/lib/memory/utils';

export const updateProperty = tool({
  description: 'Update a property owned by a player in the Monopoly game. Can update houses, hotels, and mortgage status declaratively.',
  inputSchema: z.object({
    playerName: z.string().describe('Name of the player'),
    propertyName: z.string().describe('Name of the property to update'),
    houses: z.number().optional().describe('Number of houses on the property'),
    hotels: z.number().optional().describe('Number of hotels on the property'),
    isMortgaged: z.boolean().optional().describe('Whether the property is mortgaged'),
  }),
  execute: async ({ playerName, propertyName, houses, hotels, isMortgaged }) => {
    try {
      if (!playerName || playerName.trim() === '') {
        return {
          success: false,
          message: 'Player name cannot be empty. Please provide a valid player name.',
        };
      }

      if (!propertyName || propertyName.trim() === '') {
        return {
          success: false,
          message: 'Property name cannot be empty. Please provide a valid property name.',
        };
      }

      if (houses !== undefined && houses < 0) {
        return {
          success: false,
          message: `Number of houses cannot be negative. Received: ${houses}. Please provide a non-negative number.`,
        };
      }

      if (hotels !== undefined && hotels < 0) {
        return {
          success: false,
          message: `Number of hotels cannot be negative. Received: ${hotels}. Please provide a non-negative number.`,
        };
      }

      return await withTransaction(async (memoryBank) => {
        const player = getPlayer(memoryBank, playerName);
        if (!player) {
          const availablePlayers = getAvailablePlayerNames(memoryBank);
          const playerList = availablePlayers.length > 0 
            ? `Available players: ${availablePlayers.join(', ')}.` 
            : 'No players exist yet. Add a player first using the addPlayer tool.';
          return {
            memoryBank,
            result: {
              success: false,
              message: `Player "${playerName}" does not exist. ${playerList}`,
            },
          };
        }

        const property = player.properties.find(
          p => p.name.toLowerCase() === propertyName.toLowerCase()
        );

        if (!property) {
          const playerProperties = player.properties.map(p => p.name);
          const propertyList = playerProperties.length > 0 
            ? `Player "${player.name}" owns: ${playerProperties.join(', ')}.` 
            : `Player "${player.name}" does not own any properties yet.`;
          return {
            memoryBank,
            result: {
              success: false,
              message: `Property "${propertyName}" not found. ${propertyList}`,
            },
          };
        }

        const changes: string[] = [];
        const previousState = {
          houses: property.houses,
          hotels: property.hotels,
          isMortgaged: property.isMortgaged,
        };

        if (houses !== undefined) {
          property.houses = houses;
          changes.push(`houses: ${previousState.houses} → ${houses}`);
        }

        if (hotels !== undefined) {
          property.hotels = hotels;
          changes.push(`hotels: ${previousState.hotels} → ${hotels}`);
        }

        if (isMortgaged !== undefined) {
          property.isMortgaged = isMortgaged;
          changes.push(`mortgage status: ${previousState.isMortgaged ? 'mortgaged' : 'unmortgaged'} → ${isMortgaged ? 'mortgaged' : 'unmortgaged'}`);
        }

        if (changes.length === 0) {
          return {
            memoryBank,
            result: {
              success: false,
              message: 'No updates provided. Please specify at least one field to update (houses, hotels, or isMortgaged).',
            },
          };
        }

        return {
          memoryBank,
          result: {
            success: true,
            message: `Property "${property.name}" updated for ${player.name}: ${changes.join(', ')}.`,
            property: {
              name: property.name,
              colorGroup: property.colorGroup,
              houses: property.houses,
              hotels: property.hotels,
              isMortgaged: property.isMortgaged,
            },
          },
        };
      });
    } catch (error) {
      return {
        success: false,
        message: `Error updating property: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check if the memory file is accessible.`,
      };
    }
  },
});

