import { tool } from 'ai';
import { z } from 'zod';
import { withTransaction, getPlayer, getAvailablePlayerNames, type MemoryBank } from '@/lib/memory/utils';
import { AVAILABLE_TOKENS, Token } from '@/lib/memory/types';

type AddPlayerResult = {
  success: boolean;
  message: string;
  player?: { name: string; money: number; properties: never[]; token?: Token | null; position: number };
};

export const addPlayer = tool({
  description: 'Add a new player to the Monopoly game',
  inputSchema: z.object({
    name: z.string().describe('Name of the player to add'),
    initialMoney: z.number().optional().default(1500).describe('Initial money for the player (default: 1500)'),
    token: z.enum(AVAILABLE_TOKENS).optional().describe('Optional game token for the player (e.g., Dog, Top Hat, Thimble, Boot, Battleship, Iron, Race Car, Wheelbarrow, Cat, Penguin, Rubber Ducky, T-Rex, Bag of Gold, Cannon)'),
  }),
  execute: async ({ name, initialMoney, token }) => {
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

      return await withTransaction<AddPlayerResult>(async (memoryBank: MemoryBank): Promise<{ memoryBank: MemoryBank; result: AddPlayerResult }> => {
        const existingPlayer = getPlayer(memoryBank, name);
        if (existingPlayer) {
          const availablePlayers = getAvailablePlayerNames(memoryBank);
          return {
            memoryBank,
            result: {
              success: false,
              message: `Player "${name}" already exists in the game. Current players: ${availablePlayers.join(', ')}.`,
            },
          };
        }

        if (token) {
          const playerWithToken = memoryBank.players.find(p => p.token === token);
          if (playerWithToken) {
            return {
              memoryBank,
              result: {
                success: false,
                message: `Token "${token}" is already taken by ${playerWithToken.name}. Please choose a different token.`,
              },
            };
          }
        }

        memoryBank.players.push({
          name: name.trim(),
          properties: [],
          money: initialMoney,
          token: token || null,
          inJail: false,
          position: 0,
        });

        const tokenMessage = token ? ` with token ${token}` : '';
        return {
          memoryBank,
          result: {
            success: true,
            message: `Player "${name.trim()}" added with $${initialMoney}${tokenMessage} at position 0 (Go).`,
            player: { name: name.trim(), money: initialMoney, properties: [], token: token || null, position: 0 },
          },
        };
      });
    } catch (error) {
      return {
        success: false,
        message: `Error adding player: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check if the memory file is accessible.`,
      };
    }
  },
});

