import { tool } from 'ai';
import { z } from 'zod';
import { readMemoryBank } from '@/lib/memory/utils';

export const getMemoryBank = tool({
  description: 'Get the current state of the Monopoly game (all players and their properties)',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const memoryBank = await readMemoryBank();
      
      const playerSummary = memoryBank.players.map(p => 
        `${p.name} ($${p.money}, ${p.properties.length} properties)`
      ).join(', ');

      return {
        success: true,
        memoryBank,
        summary: memoryBank.players.length > 0 
          ? `Game has ${memoryBank.players.length} player(s): ${playerSummary}.`
          : 'Game has no players yet. Add players using the addPlayer tool.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Error reading memory bank: ${error instanceof Error ? error.message : 'Unknown error'}. The memory file may be corrupted or inaccessible.`,
      };
    }
  },
});

