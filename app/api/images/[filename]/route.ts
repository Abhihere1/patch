import { NextRequest, NextResponse } from 'next/server';
import { readImageFile } from '@/lib/kb';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const sanitized = path.basename(filename);

  const buffer = await readImageFile(sanitized);
  if (!buffer) {
    console.error(`Image not found: ${sanitized}`);
    return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
  }

  const ext = path.extname(sanitized).toLowerCase();
  const contentType = MIME_MAP[ext] || 'application/octet-stream';

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: { 'Content-Type': contentType },
  });
}
