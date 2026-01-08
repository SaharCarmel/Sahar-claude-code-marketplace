import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || '/data';
const IMAGES_DIR = path.join(DATA_DIR, 'images');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params;
    const imagePath = path.join(IMAGES_DIR, ...pathParts);

    // Security: ensure path is within images directory
    const resolvedPath = path.resolve(imagePath);
    if (!resolvedPath.startsWith(path.resolve(IMAGES_DIR))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    const data = await fs.readFile(resolvedPath);

    // Determine content type from extension
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Failed to serve image:', error);
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
