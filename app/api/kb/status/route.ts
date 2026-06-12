import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { kbFileExists } from '@/lib/kb';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const [vdiAvailable, scannerAvailable] = await Promise.all([
    kbFileExists('vdi.md'),
    kbFileExists('scanner.md'),
  ]);

  return NextResponse.json({ vdi: vdiAvailable, scanner: scannerAvailable });
}
