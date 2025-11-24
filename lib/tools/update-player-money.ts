import { tool } from 'ai';
import { z } from 'zod';
import { withTransaction, getPlayer, getAvailablePlayerNames } from '@/lib/memory/utils';

export const updatePlayerMoney = tool({
  description: 'Update a player\'s money in the Monopoly game',
  inputSchema: z.object({
    playerName: z.string().describe('Name of the player'),
    amount: z.number().describe('New amount of money for the player'),
  }),
  execute: async ({ playerName, amount }) => {
    try {
      if (!playerName || playerName.trim() === '') {
        return {
          success: false,
          message: 'Player name cannot be empty. Please provide a valid player name.',
        };
      }

      if (amount < 0) {
        return {
          success: false,
          message: `Money amount cannot be negative. Received: $${amount}. Please provide a non-negative amount.`,
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

        const oldAmount = player.money;
        player.money = amount;

        return {
          memoryBank,
          result: {
            success: true,
            message: `Player "${player.name}" money updated from $${oldAmount} to $${amount}.`,
            player: { name: player.name, money: player.money },
          },
        };
      });
    } catch (error) {
      return {
        success: false,
        message: `Error updating player money: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check if the memory file is accessible.`,
      };
    }
  },
});

