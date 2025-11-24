import { tool } from 'ai';
import { z } from 'zod';
import { getBoardSpaceByPosition } from '@/lib/data/board';
import { readMemoryBank, getPlayer } from '@/lib/memory/utils';

export const getBoardSpace = tool({
  description: 'Get information about a specific board space in Monopoly by position number (0-39). Returns the space name, type, and any relevant details like property names or tax amounts.',
  inputSchema: z.object({
    position: z.number().min(0).max(39).describe('Position on the board (0-39, where 0 is Go)'),
  }),
  execute: async ({ position }) => {
    try {
      const space = getBoardSpaceByPosition(position);
      
      if (!space) {
        return {
          success: false,
          message: `No space found at position ${position}.`,
        };
      }

      const memoryBank = await readMemoryBank();
      
      let ownerInfo = '';
      if (space.propertyName) {
        const owner = memoryBank.players.find(p => 
          p.properties.some(prop => prop.name === space.propertyName)
        );
        if (owner) {
          ownerInfo = ` Owned by ${owner.name}.`;
        } else {
          ownerInfo = ' Unowned - available for purchase.';
        }
      }

      let details = `Position ${position}: ${space.name} (${space.type})`;
      
      if (space.propertyName) {
        details += ` - Property: ${space.propertyName}.${ownerInfo}`;
      }
      
      if (space.taxAmount) {
        details += ` - Tax amount: $${space.taxAmount}`;
      }

      return {
        success: true,
        position: space.position,
        name: space.name,
        type: space.type,
        propertyName: space.propertyName,
        taxAmount: space.taxAmount,
        ownerInfo: ownerInfo.trim(),
        message: details,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error getting board space: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

