import { tool } from 'ai';
import { z } from 'zod';
import { withTransaction, getPlayer, getAvailablePlayerNames, type MemoryBank } from '@/lib/memory/utils';
import { AVAILABLE_TOKENS, Token } from '@/lib/memory/types';

type UpdatePlayerResult = {
  success: boolean;
  message: string;
  player?: { name: string; token?: Token | null; inJail?: boolean; position?: number };
};

export const updatePlayer = tool({
  description: 'Update a player\'s token, jail status, or position in the Monopoly game. Note: For position updates that involve movement and passing Go, use updatePlayerPosition instead.',
  inputSchema: z.object({
    playerName: z.string().describe('Name of the player to update'),
    token: z.enum(AVAILABLE_TOKENS).optional().describe('Optional game token to assign to the player (e.g., Dog, Top Hat, Thimble, Boot, Battleship, Iron, Race Car, Wheelbarrow, Cat, Penguin, Rubber Ducky, T-Rex, Bag of Gold, Cannon)'),
    inJail: z.boolean().optional().describe('Whether the player is in jail (true) or not (false)'),
    position: z.number().min(0).max(39).optional().describe('Board position (0-39). Use updatePlayerPosition for normal movement.'),
  }).refine(
    (data) => data.token !== undefined || data.inJail !== undefined || data.position !== undefined,
    { message: 'At least one of token, inJail, or position must be provided' }
  ),
  execute: async ({ playerName, token, inJail, position }) => {
    try {
      if (!playerName || playerName.trim() === '') {
        return {
          success: false,
          message: 'Player name cannot be empty. Please provide a valid player name.',
        };
      }

      return await withTransaction<UpdatePlayerResult>(async (memoryBank: MemoryBank): Promise<{ memoryBank: MemoryBank; result: UpdatePlayerResult }> => {
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

        if (token !== undefined) {
          const playerWithToken = memoryBank.players.find(p => p.token === token && p.name !== playerName);
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

        const updates: string[] = [];
        
        if (token !== undefined) {
          const oldToken = player.token;
          player.token = token;
          updates.push(`token changed from ${oldToken || 'none'} to ${token}`);
        }

        if (inJail !== undefined) {
          const oldJailStatus = player.inJail;
          player.inJail = inJail;
          updates.push(`${inJail ? 'sent to jail' : 'released from jail'} (was ${oldJailStatus ? 'in jail' : 'not in jail'})`);
        }

        if (position !== undefined) {
          const oldPosition = player.position;
          player.position = position;
          updates.push(`position changed from ${oldPosition} to ${position}`);
        }

        return {
          memoryBank,
          result: {
            success: true,
            message: `Player "${player.name}" updated: ${updates.join(', ')}.`,
            player: { 
              name: player.name, 
              token: player.token,
              inJail: player.inJail,
              position: player.position,
            },
          },
        };
      });
    } catch (error) {
      return {
        success: false,
        message: `Error updating player: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check if the memory file is accessible.`,
      };
    }
  },
});

