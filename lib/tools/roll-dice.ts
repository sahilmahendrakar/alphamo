import { tool } from 'ai';
import { z } from 'zod';

export const rollDice = tool({
  description: 'Roll two six-sided dice for a Monopoly turn. Returns the values of both dice and their total.',
  inputSchema: z.object({}),
  execute: async () => {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    const isDoubles = die1 === die2;

    return {
      die1,
      die2,
      total,
      isDoubles,
      message: `Rolled ${die1} and ${die2} for a total of ${total}${isDoubles ? ' (doubles!)' : ''}.`,
    };
  },
});

