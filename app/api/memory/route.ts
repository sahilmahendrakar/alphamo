import { NextResponse } from 'next/server';
import { readMemoryBank } from '@/lib/memory/utils';

export async function GET() {
  try {
    const memoryBank = await readMemoryBank();
    return NextResponse.json(memoryBank);
  } catch (error) {
    console.error('Error reading memory bank:', error);
    return NextResponse.json(
      { error: 'Failed to read memory bank' },
      { status: 500 }
    );
  }
}

