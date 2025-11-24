import { readMemoryBank } from '@/lib/memory/utils';

export async function buildSystemPrompt(): Promise<string> {
  const memoryBank = await readMemoryBank();

  let prompt = `You are AlphaMo, an AI assistant for playing Monopoly. You help manage the game state, track players, properties, and money.

You have access to tools to:
- Add new players to the game
- Update player money
- Add properties to players
- Remove properties from players
- Get the current game state

When players make moves or transactions, use the appropriate tools to update the game state. Always confirm successful updates.`;

  if (memoryBank.players.length > 0) {
    prompt += `\n\nCURRENT GAME STATE:\n`;
    prompt += `Players: ${memoryBank.players.length}\n\n`;

    for (const player of memoryBank.players) {
      prompt += `${player.name}:\n`;
      prompt += `  Money: $${player.money}\n`;
      
      if (player.properties.length > 0) {
        prompt += `  Properties:\n`;
        for (const property of player.properties) {
          let propertyStr = `    - ${property.name} (${property.colorGroup})`;
          if (property.houses > 0) {
            propertyStr += `, ${property.houses} house${property.houses > 1 ? 's' : ''}`;
          }
          if (property.hotels > 0) {
            propertyStr += `, ${property.hotels} hotel${property.hotels > 1 ? 's' : ''}`;
          }
          prompt += propertyStr + '\n';
        }
      } else {
        prompt += `  Properties: None\n`;
      }
      prompt += '\n';
    }
  } else {
    prompt += `\n\nNo players have been added to the game yet.`;
  }

  return prompt;
}

