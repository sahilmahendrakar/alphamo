import { tool } from 'ai';
import { z } from 'zod';
import { readMemoryBank, writeMemoryBank, getPlayer, getAvailablePlayerNames } from '@/lib/memory/utils';

export const addProperty = tool({
  description: 'Add a property to a player in the Monopoly game',
  inputSchema: z.object({
    playerName: z.string().describe('Name of the player'),
    propertyName: z.string().describe('Name of the property'),
    colorGroup: z.string().describe('Color group of the property (e.g., blue, brown, red)'),
    houses: z.number().optional().default(0).describe('Number of houses on the property (default: 0)'),
    hotels: z.number().optional().default(0).describe('Number of hotels on the property (default: 0)'),
  }),
  execute: async ({ playerName, propertyName, colorGroup, houses, hotels }) => {
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

      if (!colorGroup || colorGroup.trim() === '') {
        return {
          success: false,
          message: 'Color group cannot be empty. Please provide a valid color group.',
        };
      }

      if (houses < 0) {
        return {
          success: false,
          message: `Number of houses cannot be negative. Received: ${houses}. Please provide a non-negative number.`,
        };
      }

      if (hotels < 0) {
        return {
          success: false,
          message: `Number of hotels cannot be negative. Received: ${hotels}. Please provide a non-negative number.`,
        };
      }

      const memoryBank = await readMemoryBank();
      
      const player = getPlayer(memoryBank, playerName);
      if (!player) {
        const availablePlayers = getAvailablePlayerNames(memoryBank);
        const playerList = availablePlayers.length > 0 
          ? `Available players: ${availablePlayers.join(', ')}.` 
          : 'No players exist yet. Add a player first using the addPlayer tool.';
        return {
          success: false,
          message: `Player "${playerName}" does not exist. ${playerList}`,
        };
      }

      const existingProperty = player.properties.find(
        p => p.name.toLowerCase() === propertyName.toLowerCase()
      );
      
      if (existingProperty) {
        return {
          success: false,
          message: `Player "${player.name}" already owns "${propertyName}". Use a different property name or remove it first.`,
        };
      }

      player.properties.push({
        name: propertyName.trim(),
        colorGroup: colorGroup.trim(),
        houses,
        hotels,
      });

      await writeMemoryBank(memoryBank);

      return {
        success: true,
        message: `Property "${propertyName.trim()}" (${colorGroup.trim()}) added to ${player.name}${houses > 0 ? ` with ${houses} house(s)` : ''}${hotels > 0 ? ` and ${hotels} hotel(s)` : ''}.`,
        property: { name: propertyName.trim(), colorGroup: colorGroup.trim(), houses, hotels },
      };
    } catch (error) {
      return {
        success: false,
        message: `Error adding property: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check if the memory file is accessible.`,
      };
    }
  },
});

