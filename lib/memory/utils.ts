import { promises as fs } from 'fs';
import { join } from 'path';
import type { MemoryBank as MemoryBankType, Player as PlayerType } from './types';

export type MemoryBank = MemoryBankType;
export type Player = PlayerType;

const MEMORY_FILE_PATH = join(process.cwd(), 'data', 'memory.json');

let fileLock: Promise<void> = Promise.resolve();

async function withFileLock<T>(operation: () => Promise<T>): Promise<T> {
  const previousLock = fileLock;
  let releaseLock: () => void;
  
  fileLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  try {
    await previousLock;
    return await operation();
  } finally {
    releaseLock!();
  }
}

function validateMemoryBank(data: unknown): { valid: boolean; error?: string; data?: MemoryBankType } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Memory bank data is not a valid object' };
  }

  const memoryBank = data as Record<string, unknown>;

  if (!Array.isArray(memoryBank.players)) {
    return { valid: false, error: 'Memory bank is missing "players" array' };
  }

  for (let i = 0; i < memoryBank.players.length; i++) {
    const player = memoryBank.players[i];
    if (typeof player !== 'object' || player === null) {
      return { valid: false, error: `Player at index ${i} is not a valid object` };
    }

    const p = player as Record<string, unknown>;
    if (typeof p.name !== 'string' || p.name.trim() === '') {
      return { valid: false, error: `Player at index ${i} has invalid or missing name` };
    }
    if (!Array.isArray(p.properties)) {
      return { valid: false, error: `Player "${p.name}" is missing properties array` };
    }
    if (typeof p.money !== 'number') {
      return { valid: false, error: `Player "${p.name}" has invalid or missing money value` };
    }
  }

  return { valid: true, data: memoryBank as unknown as MemoryBankType };
}

export async function ensureMemoryFile(): Promise<void> {
  try {
    const dataDir = join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    try {
      await fs.access(MEMORY_FILE_PATH);
    } catch {
      const emptyMemory: MemoryBankType = { players: [] };
      await fs.writeFile(MEMORY_FILE_PATH, JSON.stringify(emptyMemory, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error ensuring memory file:', error);
    throw new Error(`Failed to ensure memory file exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function readMemoryBank(): Promise<MemoryBankType> {
  return withFileLock(async () => {
    try {
      await ensureMemoryFile();
      const fileContent = await fs.readFile(MEMORY_FILE_PATH, 'utf-8');
      
      if (!fileContent || fileContent.trim() === '') {
        const emptyMemory: MemoryBankType = { players: [] };
        await fs.writeFile(MEMORY_FILE_PATH, JSON.stringify(emptyMemory, null, 2), 'utf-8');
        return emptyMemory;
      }

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error(`Memory file contains invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
      }

      const validation = validateMemoryBank(parsedData);
      if (!validation.valid) {
        throw new Error(`Memory file data is invalid: ${validation.error}`);
      }

      return validation.data!;
    } catch (error) {
      console.error('Error reading memory bank:', error);
      throw error;
    }
  });
}

export async function writeMemoryBank(memoryBank: MemoryBankType): Promise<void> {
  return withFileLock(async () => {
    try {
      const validation = validateMemoryBank(memoryBank);
      if (!validation.valid) {
        throw new Error(`Cannot write invalid memory bank: ${validation.error}`);
      }

      await ensureMemoryFile();
      await fs.writeFile(MEMORY_FILE_PATH, JSON.stringify(memoryBank, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing memory bank:', error);
      throw new Error(`Failed to write memory bank: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

export function getPlayer(memoryBank: MemoryBankType, name: string): PlayerType | undefined {
  return memoryBank.players.find(player => player.name.toLowerCase() === name.toLowerCase());
}

export function getAvailablePlayerNames(memoryBank: MemoryBankType): string[] {
  return memoryBank.players.map(player => player.name);
}

export async function withTransaction<T = unknown>(
  callback: (memoryBank: MemoryBankType) => Promise<{ memoryBank: MemoryBankType; result: T }>
): Promise<T> {
  return withFileLock(async () => {
    try {
      await ensureMemoryFile();
      const fileContent = await fs.readFile(MEMORY_FILE_PATH, 'utf-8');
      
      let memoryBank: MemoryBankType;
      if (!fileContent || fileContent.trim() === '') {
        memoryBank = { players: [] };
      } else {
        let parsedData: unknown;
        try {
          parsedData = JSON.parse(fileContent);
        } catch (parseError) {
          throw new Error(`Memory file contains invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
        }

        const validation = validateMemoryBank(parsedData);
        if (!validation.valid) {
          throw new Error(`Memory file data is invalid: ${validation.error}`);
        }
        memoryBank = validation.data!;
      }

      const { memoryBank: updatedMemoryBank, result } = await callback(memoryBank);

      const validation = validateMemoryBank(updatedMemoryBank);
      if (!validation.valid) {
        throw new Error(`Cannot write invalid memory bank: ${validation.error}`);
      }

      await fs.writeFile(MEMORY_FILE_PATH, JSON.stringify(updatedMemoryBank, null, 2), 'utf-8');
      
      return result;
    } catch (error) {
      console.error('Error in transaction:', error);
      throw error;
    }
  });
}

