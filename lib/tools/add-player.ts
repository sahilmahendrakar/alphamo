import { tool } from 'ai';
import { z } from 'zod';
import { readMemoryBank, writeMemoryBank, getPlayer, getAvailablePlayerNames } from '@/lib/memory/utils';

export const addPlayer = tool({
  description: 'Add a new player to the Monopoly game',
  inputSchema: z.object({
    name: z.string().describe('Name of the player to add'),
    initialMoney: z.number().optional().default(1500).describe('Initial money for the player (default: 1500)'),
  }),
  execute: async ({ name, initialMoney }) => {
    try {
      if (!name || name.trim() === '') {
        return {
          success: false,
          message: 'Player name cannot be empty. Please provide a valid player name.',
        };
      }

      if (initialMoney < 0) {
        return {
          success: false,
          message: `Initial money cannot be negative. Received: $${initialMoney}. Please provide a non-negative amount.`,
        };
      }

      const memoryBank = await readMemoryBank();
      
      const existingPlayer = getPlayer(memoryBank, name);
      if (existingPlayer) {
        const availablePlayers = getAvailablePlayerNames(memoryBank);
        return {
          success: false,
          message: `Player "${name}" already exists in the game. Current players: ${availablePlayers.join(', ')}.`,
        };
      }

      memoryBank.players.push({
        name: name.trim(),
        properties: [],
        money: initialMoney,
      });

      await writeMemoryBank(memoryBank);

      return {
        success: true,
        message: `Player "${name.trim()}" added with $${initialMoney}.`,
        player: { name: name.trim(), money: initialMoney, properties: [] },
      };
    } catch (error) {
      return {
        success: false,
        message: `Error adding player: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check if the memory file is accessible.`,
      };
    }
  },
});

