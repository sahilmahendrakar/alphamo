import { tool } from 'ai';
import { z } from 'zod';
import { withTransaction, getPlayer, type MemoryBank } from '@/lib/memory/utils';
import { getBoardSpaceByPosition } from '@/lib/data/board';

type UpdatePositionResult = {
  success: boolean;
  message: string;
  oldPosition?: number;
  newPosition?: number;
  passedGo?: boolean;
  landedOn?: string;
};

export const updatePlayerPosition = tool({
  description: 'Update a player\'s position on the Monopoly board. Automatically handles passing Go (adds $200) and wraps around the board (positions 0-39).',
  inputSchema: z.object({
    playerName: z.string().describe('Name of the player to update'),
    spacesToMove: z.number().describe('Number of spaces to move forward (can be negative for special cases)'),
  }),
  execute: async ({ playerName, spacesToMove }) => {
    try {
      return await withTransaction<UpdatePositionResult>(async (memoryBank: MemoryBank): Promise<{ memoryBank: MemoryBank; result: UpdatePositionResult }> => {
        const player = getPlayer(memoryBank, playerName);
        
        if (!player) {
          return {
            memoryBank,
            result: {
              success: false,
              message: `Player "${playerName}" not found. Cannot update position.`,
            },
          };
        }

        const oldPosition = player.position;
        let newPosition = (oldPosition + spacesToMove) % 40;
        
        if (newPosition < 0) {
          newPosition += 40;
        }

        const passedGo = spacesToMove > 0 && newPosition < oldPosition;
        
        if (passedGo) {
          player.money += 200;
        }

        player.position = newPosition;

        const landedSpace = getBoardSpaceByPosition(newPosition);
        const landedOnName = landedSpace?.name || `position ${newPosition}`;

        let message = `${playerName} moved from position ${oldPosition} to position ${newPosition} (${landedOnName}).`;
        if (passedGo) {
          message += ` Passed Go and collected $200.`;
        }

        return {
          memoryBank,
          result: {
            success: true,
            message,
            oldPosition,
            newPosition,
            passedGo,
            landedOn: landedOnName,
          },
        };
      });
    } catch (error) {
      return {
        success: false,
        message: `Error updating player position: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

