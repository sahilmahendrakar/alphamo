import { tool } from 'ai';
import { z } from 'zod';
import { withTransaction, getPlayer, getAvailablePlayerNames } from '@/lib/memory/utils';

export const removeProperty = tool({
  description: 'Remove a property from a player in the Monopoly game',
  inputSchema: z.object({
    playerName: z.string().describe('Name of the player'),
    propertyName: z.string().describe('Name of the property to remove'),
  }),
  execute: async ({ playerName, propertyName }) => {
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

        const propertyIndex = player.properties.findIndex(
          p => p.name.toLowerCase() === propertyName.toLowerCase()
        );

        if (propertyIndex === -1) {
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

        const removedProperty = player.properties.splice(propertyIndex, 1)[0];

        return {
          memoryBank,
          result: {
            success: true,
            message: `Property "${removedProperty.name}" removed from ${player.name}.`,
            property: removedProperty,
          },
        };
      });
    } catch (error) {
      return {
        success: false,
        message: `Error removing property: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check if the memory file is accessible.`,
      };
    }
  },
});

